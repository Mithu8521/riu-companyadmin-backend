import { EmailNotificationsAndDueDateDaoService } from '@modules/dao/setting/email_notifications_and_due_date-dao/email_notifications_and_due_date-dao.service';
import { Injectable, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { CreateEmailNotificationAndDueDateDto } from './dto/create-email_notifications_and_due_date.dto';
import { DueDateType, QuestionFrequencyType, DueDateRule, NotificationsTypeEnum, EmailNotificationsStatus } from '@utils/enums/Status';
import { UserDaoService } from '@modules/dao/setting/user-dao/user-dao.service';
import { SendMailService } from '@utils/common/send-mail/send-mail.service';
import { OrgChartDaoService } from '@modules/dao/setting/org-chart-dao/org-chart-dao.service';
import { ExternalApiCallService } from '@utils/common/external-api-call/external-api-call.service';
import { DashboardDaoService } from '@modules/dao/dashboard-dao/dashboard-dao.service';
import { SourceDaoService } from '@modules/dao/setting/source-dao/source-dao.service';
import { console } from 'inspector';
import { QuestionDueDateEntity } from './entities/email_notifications_and_due_date.entity';
import { CustomDashboardDaoService } from '@app/modules/dao/custom-dashboard-dao/custom-dashboard-dao.service';
import { SuperAdminClientService } from '@app/modules/super-admin-client/super-admin-client.service';
import { getSustainabilityInsightWidgets } from './configs/sustainability-insights.config';
import { PuppeteerChartService } from '@app/modules/puppeteer-chart/puppeteer-chart.service';

import * as MarkdownIt from 'markdown-it';
import * as sup from 'markdown-it-sup';

interface OrgData {
    userId: string;
    orgChart?: any;
    children?: OrgData[];
}
type PeriodRow = {
    fromDate: string;
    toDate: string;
    displayName: string;
    calToDate: string
}

@Injectable()
export class EmailNotificationsAndDueDateService {
    private md = new (MarkdownIt as any)({
        breaks: true,
    }).use(sup);

    constructor(
        private emailNotificationsAndDueDateDaoService: EmailNotificationsAndDueDateDaoService, 
        private userDaoService: UserDaoService, 
        private sendMailService: SendMailService, 
        private orgChartDaoService: OrgChartDaoService, 
        private externalApiCallService: ExternalApiCallService, 
        private dashboardDaoService: DashboardDaoService, 
        private sourceDaoService: SourceDaoService,
        private customDashboardDaoService: CustomDashboardDaoService,
        private superAdminClientService: SuperAdminClientService,
        private puppeteerChartService: PuppeteerChartService
    ) { }

    async saveEmailReminder(createDto: CreateEmailNotificationAndDueDateDto, request: any) {
        try {
            const { userid } = request.headers;
            type FinancialYear = { id: number; financial_year_value: string };
            const getCompany = await this.userDaoService.getHeadOfficeCompanyDetails(true);

            const financialYearData: { data: FinancialYear[] } = await this.externalApiCallService.getReq(
                process.env.COMPANY_SERVER_API_URL + 'getFinancialYear',
                { userId: getCompany.company_id, type: 'COMPANY' },
                {},
            );

            const financialYearValue = financialYearData.data.find(
                (fy: FinancialYear) => fy.id === createDto.financialYear
            )?.financial_year_value || "Not Found";

            const allNotifications = [];

            Object.entries(createDto.notificationsByType).forEach(([notificationType, notifications]) => {
                if (Array.isArray(notifications) && notifications.length > 0) {
                    notifications.forEach(notification => {
                        allNotifications.push({
                            ...notification,
                            notificationType: notificationType,
                            ccList: [...new Set((notification.ccList ?? '').split(',')
                                .map(cc_email => cc_email.trim()))].join(','),
                        });
                    });
                }
            });

            if (createDto.questionType === 'everyYear' || createDto.questionType === 'oneTime') {
                const financialYearRange = await this.getFinancialYearRange(
                    financialYearValue,
                    getCompany?.starting_month - 1
                );
                try {
                    let dueDate: Date | null = null;
                    if (createDto.dueDateConfiguration === null) {
                        await this.emailNotificationsAndDueDateDaoService.deleteAllDataByFinancialYear(createDto.financialYear);
                        await this.emailNotificationsAndDueDateDaoService.deleteAllNotificationsDataByFinancialYearId(createDto.financialYear);
                        return {
                            isSuccess: true,
                            message: `Successfully deleted all data`,
                        };
                    }
                    if (createDto.dueDateConfiguration.type === 'selectDate' && createDto.dueDateConfiguration.fixedDate) {
                        dueDate = new Date(createDto.dueDateConfiguration.fixedDate);
                        dueDate.setDate(dueDate.getDate() + 1);
                    } else if (
                        createDto.dueDateConfiguration.type === 'applyRule' &&
                        financialYearRange.toDate &&
                        createDto.dueDateConfiguration.days != null
                    ) {
                        const baseDate = new Date(financialYearRange.calEndMonth);

                        if (createDto.dueDateConfiguration.rule === DueDateRule.AFTER) {
                            baseDate.setDate(baseDate.getDate() + createDto.dueDateConfiguration.days + 1);
                        } else if (createDto.dueDateConfiguration.rule === DueDateRule.BEFORE) {
                            baseDate.setDate(baseDate.getDate() - createDto.dueDateConfiguration.days + 1);
                        }

                        dueDate = baseDate;
                        dueDate.setHours(0, 0, 0, 0);
                    }

                    const dueDateConfigData: Partial<QuestionDueDateEntity> = {
                        userId: Number(userid),
                        financialYearId: createDto.financialYear,
                        periodRecord: financialYearRange,
                        questionFrequencyType: createDto.questionType as QuestionFrequencyType,
                        dueDateType: createDto.dueDateConfiguration.type as DueDateType,
                        // fixedDate: dueDate ? this.formatDateIST(dueDate) : null, // ✅ IST
                        fixedDate: dueDate ? dueDate.toISOString().split("T")[0] : null,
                        rule: createDto.dueDateConfiguration.rule as DueDateRule ?? null,
                        ruleDays: createDto.dueDateConfiguration.days ?? null,
                        configuration: createDto,
                    };

                    const existingDueDateConfig =
                        await this.emailNotificationsAndDueDateDaoService.findExistingQuestionDueDateByPeriodDates(
                            Number(userid),
                            createDto.financialYear,
                            createDto.questionType as QuestionFrequencyType,
                            financialYearRange.fromDate,
                            financialYearRange.toDate,
                        );

                    let dueDateConfigId: number;

                    if (existingDueDateConfig) {
                        await this.emailNotificationsAndDueDateDaoService.updateQuestionDueDate(
                            existingDueDateConfig.id,
                            dueDateConfigData
                        );
                        dueDateConfigId = existingDueDateConfig.id;

                        await this.emailNotificationsAndDueDateDaoService.deleteNotificationsByDueDateConfigId(dueDateConfigId);
                    } else {
                        const savedDueDateConfig =
                            await this.emailNotificationsAndDueDateDaoService.saveQuestionDueDate(dueDateConfigData);
                        dueDateConfigId = savedDueDateConfig.id;
                    }

                    for (const notification of allNotifications) {
                        try {
                            let baseDate = new Date(dueDate);
                            if (notification.frequency === 'once') {
                                if (notification.ruleType === DueDateRule.AFTER) {
                                    baseDate.setDate(baseDate.getDate() + notification.daysBeforeDueDate);
                                } else if (notification.ruleType === DueDateRule.BEFORE) {
                                    baseDate.setDate(baseDate.getDate() - notification.daysBeforeDueDate - 1);
                                }
                            } else {
                                if (notification.ruleType === DueDateRule.AFTER) {
                                    baseDate.setDate(baseDate.getDate() + notification.daysBeforeDueDate);
                                } else if (notification.ruleType === DueDateRule.BEFORE) {
                                    baseDate.setDate(baseDate.getDate() - notification.daysBeforeDueDate);
                                }
                            }


                            if (baseDate > new Date(dueDate) && notification.frequency != 'once') {
                                const temp = baseDate;
                                baseDate = new Date(dueDate);
                                dueDate = temp;
                            }

                            const reminderTimes = this.calculateReminderDateTimes(
                                baseDate,
                                dueDate,
                                notification.frequency,
                                notification.fixedTime,
                                notification.fromTime,
                                notification.toTime,
                                notification.selectedDay,
                            );

                            for (const reminderTime of reminderTimes) {
                                let validTillTime: Date | null = null;

                                switch (notification.frequency) {
                                    case 'hourly':
                                        validTillTime = new Date(reminderTime);
                                        validTillTime.setHours(validTillTime.getHours() + 1);
                                        break;

                                    case 'daily':
                                        validTillTime = new Date(reminderTime);
                                        validTillTime.setDate(validTillTime.getDate() + 1);
                                        break;

                                    case 'weekly':
                                        validTillTime = new Date(reminderTime);
                                        validTillTime.setDate(validTillTime.getDate() + 7);
                                        break;

                                    case 'once':
                                        validTillTime = new Date(reminderTime);
                                        validTillTime.setDate(validTillTime.getDate() + 7);
                                        break;

                                    default:
                                        validTillTime = new Date(reminderTime);
                                }
                                validTillTime.setMinutes(validTillTime.getMinutes() - 1);

                                const notificationsData = {
                                    dueDateConfigId: dueDateConfigId,
                                    userId: Number(userid),
                                    ccList: notification.ccList,
                                    financialYearId: createDto.financialYear,
                                    periodRecord: financialYearRange,
                                    notificationsType: notification.notificationType as NotificationsTypeEnum,
                                    notificationsDateTime: reminderTime, // ✅ reminder start
                                    validTillTime: validTillTime,        // ✅ calculated expiry
                                    status: EmailNotificationsStatus.PENDING,
                                };

                                await this.emailNotificationsAndDueDateDaoService.saveNotification(notificationsData);
                            }

                        } catch (error) {
                            console.error('Error saving notification:', error);
                        }
                    }
                } catch (error) {
                    console.error('Error processing everyYear/oneTime:', error);
                }
                return {
                    isSuccess: true,
                    message: `Successfully saved Notifications`,
                };
            } else {
                const periods = await this.generatePeriods(
                    getCompany?.frequency,
                    getCompany?.starting_month,
                    financialYearValue
                );
                for (const period of periods) {
                    try {
                        let dueDate: Date | null = null;
                        if (createDto.dueDateConfiguration === null || createDto.dueDateConfiguration.type === null) {
                            await this.emailNotificationsAndDueDateDaoService.deleteAllDataByFinancialYear(createDto.financialYear);
                            await this.emailNotificationsAndDueDateDaoService.deleteAllNotificationsDataByFinancialYearId(createDto.financialYear);
                            return {
                                isSuccess: true,
                                message: `Successfully deleted all data`,
                            };

                        }
                        if (createDto.dueDateConfiguration.type === 'selectDate' && createDto.dueDateConfiguration.fixedDate) {
                            dueDate = new Date(createDto.dueDateConfiguration.fixedDate);
                            dueDate.setDate(dueDate.getDate() + 1);
                        } else if (
                            createDto.dueDateConfiguration.type === 'applyRule' &&
                            period.toDate &&
                            createDto.dueDateConfiguration.days != null
                        ) {
                            const baseDate = new Date(period.calToDate);

                            if (createDto.dueDateConfiguration.rule === DueDateRule.AFTER) {
                                baseDate.setDate(baseDate.getDate() + createDto.dueDateConfiguration.days + 2);
                            } else if (createDto.dueDateConfiguration.rule === DueDateRule.BEFORE) {
                                baseDate.setDate(baseDate.getDate() - createDto.dueDateConfiguration.days + 1);
                            }
                            dueDate = baseDate;
                            dueDate.setHours(0, 0, 0, 0);
                        }

                        const dueDateConfigData: Partial<QuestionDueDateEntity> = {
                            userId: Number(userid),
                            financialYearId: createDto.financialYear,
                            periodRecord: period,
                            questionFrequencyType: createDto.questionType as QuestionFrequencyType,
                            dueDateType: createDto.dueDateConfiguration.type as DueDateType,
                            // fixedDate: dueDate ? this.formatDateIST(dueDate) : null, // ✅ IST
                            fixedDate: dueDate ? dueDate.toISOString().split("T")[0] : null,
                            rule: createDto.dueDateConfiguration.rule as DueDateRule ?? null,
                            ruleDays: createDto.dueDateConfiguration.days ?? null,
                            configuration: createDto,
                        };

                        const existingDueDateConfig =
                            await this.emailNotificationsAndDueDateDaoService.findExistingQuestionDueDateByPeriodDates(
                                Number(userid),
                                createDto.financialYear,
                                createDto.questionType as QuestionFrequencyType,
                                period.fromDate,
                                period.toDate,
                            );

                        let dueDateConfigId: number;

                        if (existingDueDateConfig) {
                            await this.emailNotificationsAndDueDateDaoService.updateQuestionDueDate(
                                existingDueDateConfig.id,
                                dueDateConfigData
                            );
                            dueDateConfigId = existingDueDateConfig.id;

                            await this.emailNotificationsAndDueDateDaoService.deleteNotificationsByDueDateConfigId(dueDateConfigId);
                        } else {
                            const savedDueDateConfig =
                                await this.emailNotificationsAndDueDateDaoService.saveQuestionDueDate(dueDateConfigData);
                            dueDateConfigId = savedDueDateConfig.id;
                        }
                        dueDate.setDate(dueDate.getDate() - 1);
                        for (const notification of allNotifications) {
                            try {

                                let baseDate = new Date(dueDate);
                                if (notification.frequency === 'once') {
                                    if (notification.ruleType === DueDateRule.AFTER) {
                                        baseDate.setDate(baseDate.getDate() + notification.daysBeforeDueDate);
                                    } else if (notification.ruleType === DueDateRule.BEFORE) {
                                        baseDate.setDate(baseDate.getDate() - notification.daysBeforeDueDate - 1);
                                    }
                                } else {
                                    if (notification.ruleType === DueDateRule.AFTER) {
                                        baseDate.setDate(baseDate.getDate() + notification.daysBeforeDueDate);
                                    } else if (notification.ruleType === DueDateRule.BEFORE) {
                                        baseDate.setDate(baseDate.getDate() - notification.daysBeforeDueDate);
                                    }
                                }


                                if (baseDate > new Date(dueDate) && notification.frequency != 'once') {
                                    const temp = baseDate;
                                    baseDate = new Date(dueDate);
                                    dueDate = temp;
                                }

                                const reminderTimes = this.calculateReminderDateTimes(
                                    baseDate,
                                    // new Date(dueDate), // ✅ convert back to Date in IST
                                    dueDate,
                                    notification.frequency,
                                    notification.fixedTime,
                                    notification.fromTime,
                                    notification.toTime,
                                    notification.selectedDay,
                                );

                                for (const reminderTime of reminderTimes) {
                                    let validTillTime: Date | null = null;

                                    switch (notification.frequency) {
                                        case 'hourly':
                                            validTillTime = new Date(reminderTime);
                                            validTillTime.setHours(validTillTime.getHours() + 1);
                                            break;

                                        case 'daily':
                                            validTillTime = new Date(reminderTime);
                                            validTillTime.setDate(validTillTime.getDate() + 1);
                                            break;

                                        case 'weekly':
                                            validTillTime = new Date(reminderTime);
                                            validTillTime.setDate(validTillTime.getDate() + 7);
                                            break;

                                        case 'once':
                                            validTillTime = new Date(reminderTime);
                                            validTillTime.setDate(validTillTime.getDate() + 7);
                                            break;

                                        default:
                                            validTillTime = new Date(reminderTime);
                                    }
                                    validTillTime.setMinutes(validTillTime.getMinutes() - 1);
                                    const notificationsData = {
                                        dueDateConfigId: dueDateConfigId,
                                        userId: Number(userid),
                                        ccList: notification.ccList,
                                        financialYearId: createDto.financialYear,
                                        periodRecord: period,
                                        notificationsType: notification.notificationType as NotificationsTypeEnum,
                                        notificationsDateTime: reminderTime, // ✅ IST date
                                        validTillTime: validTillTime,        // ✅ calculated expiry

                                        status: EmailNotificationsStatus.PENDING,
                                    };
                                    await this.emailNotificationsAndDueDateDaoService.saveNotification(notificationsData);
                                }

                            } catch (error) {
                                console.error('Error saving notification:', error);
                            }
                        }
                    } catch (error) {
                        console.error('Error processing period:', error);
                    }
                }
                return {
                    isSuccess: true,
                    message: `Successfully saved Notifications`,
                };
            }
        } catch (error) {
            throw new BadRequestException(`Failed to save email reminder: ${error.message}`);
        }
    }

    private formatDateIST(date: Date): string {
        const istOffset = 5.5 * 60 * 60 * 1000;
        const istDate = new Date(date.getTime() + istOffset);
        const year = istDate.getUTCFullYear();
        const month = String(istDate.getUTCMonth() + 1).padStart(2, "0");
        const day = String(istDate.getUTCDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    private setISTTime(date: Date, timeStr: string): void {
        const [hours, minutes] = timeStr.split(":").map(Number);
        date.setHours(hours, minutes, 0, 0);
    }

    private calculateReminderDateTimes(
        baseDate: Date,
        dueDate: Date,
        frequency: string,
        fixedTime: string,
        fromTime?: string,
        toTime?: string,
        selectedDay?: string
    ): Date[] {
        const reminders: Date[] = [];
        let current = new Date(baseDate);

        // const setTime = (date: Date, timeStr: string) => {
        //     this.setISTTime(date, timeStr);
        // };

        const setTime = (date: Date, timeStr: string) => {
            const [hours, minutes] = timeStr.split(':').map(Number);
            date.setHours(hours, minutes, 0, 0);
        };


        switch (frequency) {
            case 'once':
                if (fixedTime) setTime(current, fixedTime);
                reminders.push(new Date(current));
                break;

            case 'hourly':
                if (!fromTime || !toTime) break;

                const [fromHour, fromMin] = fromTime.split(':').map(Number);
                const [toHour, toMin] = toTime.split(':').map(Number);

                current.setHours(fromHour, fromMin, 0, 0);

                const dayEnd = new Date(current);
                dayEnd.setHours(toHour, toMin, 0, 0);

                while (current <= dueDate) {
                    if (current.getHours() >= fromHour && current < dayEnd) {
                        reminders.push(new Date(current));
                    }

                    current.setHours(current.getHours() + 1);

                    if (current.getHours() === 0 && current < dueDate) {
                        current.setHours(fromHour, fromMin, 0, 0);
                        dayEnd.setHours(toHour, toMin, 0, 0);
                        dayEnd.setDate(dayEnd.getDate() + 1);
                    }
                }
                break;

            case 'daily':
                while (current <= dueDate) {
                    if (fixedTime) setTime(current, fixedTime);
                    reminders.push(new Date(current));
                    current.setDate(current.getDate() + 1);
                }
                break;

            case 'weekly':
                while (current <= dueDate) {
                    if (fixedTime) setTime(current, fixedTime);
                    reminders.push(new Date(current));
                    current.setDate(current.getDate() + 7);
                }
                break;
            case 'monthly':
                current.setDate(1);
                while (current <= dueDate) {
                    if (fixedTime) setTime(current, fixedTime);
                    reminders.push(new Date(current));
                    current.setMonth(current.getMonth() + 1);
                }
                break;

            default:
                if (fixedTime) setTime(current, fixedTime);
                reminders.push(new Date(current));
        }

        return reminders;
    }



    async getEmailReminders(request: any) {
        try {

            const reminders = await this.emailNotificationsAndDueDateDaoService.getEmailDueDateRemindersByFinancialYear(
                request.query.financialYearId,
            );

            return {
                isSuccess: true,
                message: 'Email reminders retrieved successfully',
                data: reminders
            };

        } catch (error) {
            throw new BadRequestException(`Failed to get email reminders: ${error.message}`);
        }
    }

    async emailNotificationConfiguration(request: any) {
        try {

            const reminders = await this.emailNotificationsAndDueDateDaoService.getConfigurations(
                request.query.financialYearId,
                request.query.questionType
            );

            return {
                isSuccess: true,
                message: 'Email Configurations retrieved successfully',
                data: reminders
            };

        } catch (error) {
            throw new BadRequestException(`Failed to get email Configurations: ${error.message}`);
        }
    }

    async runCronSetup(request: any) {
        let { isDebug, debugTo } = request.body;

        isDebug = isDebug?.toLowerCase() === "false"
            ? false : true;

        if (isDebug && !debugTo) {
            throw new HttpException("missing param 'debugTo' for isDebug=true", HttpStatus.BAD_REQUEST);
        }

        await this.sustainablityInsightsReportToAdmin(isDebug, debugTo);
        await this.performanceReportToAdmin(isDebug, debugTo);
        await this.dataOwnerReportToUser(isDebug, debugTo);
        await this.auditorReportToUser(isDebug, debugTo);
        await this.sendDataOwnerAppreciationToUsers(isDebug, debugTo);
        await this.sendAuditorAppreciationToUsers(isDebug, debugTo);
    }


    async sustainablityInsightsReportToAdmin(isDebug, debugTo) {
        try {
            const companyDetails = await this.userDaoService.getHeadOfficeCompanyDetails(true);
            if (!companyDetails) {
                throw new HttpException("Company details not found", HttpStatus.NOT_FOUND);
            }

            const financialYears = await this.superAdminClientService.getFinancialYears(companyDetails.company_id);
            if (!financialYears || financialYears.length === 0) {
                throw new HttpException("No valid financial year found", HttpStatus.NOT_FOUND);
            }

            const frameworkIds = await this.superAdminClientService.getFrameworkIds(companyDetails.company_id);
            if (!frameworkIds || frameworkIds.length === 0) {
                throw new HttpException("No valid framework found", HttpStatus.NOT_FOUND);
            }

            // Pick first frameworkId for now
            const frameworkId = frameworkIds[0];

            const pendingNotifications = await this.emailNotificationsAndDueDateDaoService.getEmailNotifications('sustainabilityInsights' as NotificationsTypeEnum);
            if (pendingNotifications.length) {
                // Pick the first pending notification
                const notification = pendingNotifications[0];
                const currentFinancialYear = financialYears.find(fy => fy.id === notification.financialYearId);
                const periods = this.generatePeriods(companyDetails.frequency, companyDetails.starting_month, currentFinancialYear.financial_year_value);
                const validPeriods = periods.filter(p => p.fromDate <= notification.periodRecord.fromDate);

                let sustainabilityInsights = [], attachments = [];
                for (const widget of getSustainabilityInsightWidgets(frameworkId)) {
                    const widgetConfig = widget.buildWidget(validPeriods.map(p => p.displayName), [currentFinancialYear.financial_year_value]);
                    const data = await this.customDashboardDaoService.processWidgetQuery(widgetConfig.group_by[0], widgetConfig.group_by?.[1], widgetConfig);
                    const graphImage = await this.puppeteerChartService.getChartPng(data, {type: widget.type, groupByFields: widgetConfig.group_by, supportedOrder: validPeriods.map(p => p.displayName)});
                    const insights = (await this.superAdminClientService.getGraphInsights(widget.name, data, 'ANTHROPIC'))?.response;
                    sustainabilityInsights.push({
                        name: widget.name,
                        widgetConfig: widgetConfig,
                        data: data,
                        insights: this.md.renderInline(insights),
                        // insights: this.md.renderInline(`**Fuel Consumption**\n\nApril's fuel consumption was dominated by LPG and diesel, which together accounted for the vast majority of total fuel usage. LPG led consumption at 44,451 kg, followed by diesel at 34,061 liters, while petrol usage remained relatively modest at 4,419 liters.\n\n- PNG consumption reached 6,547 SCM, indicating moderate natural gas utilization alongside primary fuel sources.\n- Coal, furnace oil, and briquettes showed zero consumption, suggesting operations relied entirely on cleaner fuel alternatives.\n- The fuel mix demonstrates a preference for LPG and diesel-based operations, with minimal reliance on solid fuels or heavy oils.`),
                        graphImage: `cid:${widget.cid}`
                    });

                    attachments.push({
                        filename: widget.cidFilename,
                        content: graphImage,
                        cid: widget.cid,
                    });
                }

                const admins = await this.userDaoService.allAdminDetails(true);
                const to = admins.map(user => user.email).join(",");
                const results = admins.map(user => ({userId: user.id})) as [];
                const currentDate = new Date();

                const generatedDate = currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                const reportingPeriod =
                    `${this.formatDate(`${notification.periodRecord.fromDate}-01`)} - ${this.formatDate(notification.periodRecord.calToDate)}`;

                const reportData = {
                    sustainabilityInsights,
                    generatedDate,
                    reportingPeriod
                };

                const sustainabilityInsightsWithoutImages = (sustainabilityInsights || []).map(item => {
                    const { graphImage, ...rest } = item;
                    return rest;
                });

                const performanceReportPayload = {
                    emailData: {
                        userDetails: admins.join(","),
                        templatePath: '/../../../public/views/templates/admin-reminder.html',
                        subject: `Performance Tracking Report - ${currentDate.toLocaleDateString('en-US', {
                            month: 'long',
                            year: 'numeric',
                        })}`,
                        reportData: {
                            ...reportData,
                            sustainabilityInsights: sustainabilityInsightsWithoutImages,
                        },
                    },
                };

                const emailHistory = await this.userDaoService.insertNewEmailHistory(
                    isDebug ? debugTo : to,
                    'SUSTAINABILITY_INSIGHTS_REPORT',
                    false,
                    performanceReportPayload,
                    notification.ccList,
                );

                const emailStatus = await this.sendMailService.sendEmailReport(
                    isDebug ? debugTo : to,
                    notification.ccList,
                    `Sustainability Insights Report - ${this.getReportingPeriodString(notification.periodRecord)}`,
                    admins[0],
                    '/../../../public/views/templates/sustainability-insights-report.html',
                    reportData,
                    'SUSTAINABILITY_INSIGHTS_REPORT',
                    attachments
                );

                await this.userDaoService.updateStatusEmailHistory(
                    emailHistory.id,
                    emailStatus
                );

                await this.emailNotificationsAndDueDateDaoService.updateStatusAndUser(notification.id, results, 'sent' as EmailNotificationsStatus)

                return {
                    success: true,
                    message: 'Sustainability Insights report sent successfully to all admins',
                    reportData,
                };
            }
            
        } catch (error) {
            throw new BadRequestException(`Failed to send sustainability insights report: ${error.message}`);
        }
    }

    async performanceReportToAdmin(isDebug, debugTo) {
        try {

            type FinancialYear = { id: number; financial_year_value: string };
            const getCompany = await this.userDaoService.getHeadOfficeCompanyDetails(true);
            const allAdmin = await this.userDaoService.allAdminDetails(true);

            const financialYearData: { data: FinancialYear[] } = await this.externalApiCallService.getReq(
                process.env.COMPANY_SERVER_API_URL + 'getFinancialYear',
                { userId: getCompany.company_id, type: 'COMPANY' },
                {},
            );

            const lastFinancialYearData = financialYearData.data[financialYearData.data.length - 1];
            const financialYearId = Number(lastFinancialYearData.id);
            const financialYearValue = financialYearData.data.find(
                (fy: FinancialYear) => fy.id === financialYearId
            )?.financial_year_value || "Not Found";


            const periods = await this.generatePeriods(getCompany?.frequency, getCompany?.starting_month, financialYearValue);
            const actualNotifications = await this.emailNotificationsAndDueDateDaoService.getEmailNotifications('admin' as NotificationsTypeEnum);
            if (actualNotifications.length) {

                const actualNotification = actualNotifications[0];
                const dueDate = await this.emailNotificationsAndDueDateDaoService.getPeriodDueDate(actualNotification.dueDateConfigId);
                const allPendingPeriods = periods.filter(p => p.fromDate <= actualNotification.periodRecord.fromDate);
                const start = new Date(dueDate.fixedDate);
                const now = new Date();

                const ms = now.getTime() - start.getTime();
                const remDays = Math.floor(ms / (1000 * 60 * 60 * 24));

                const sourceIds = await this.sourceDaoService.getAllLocation();
                const sourceIdName = await this.sourceDaoService.getAllLocationName();
                const subLocations = await this.sourceDaoService.getSubSourceBasedOnIds()

                const forAllPeriodsData = await this.teamWorkloadProgess(lastFinancialYearData.id, lastFinancialYearData.financial_year_value, getCompany.id, allPendingPeriods, sourceIds, sourceIdName, subLocations);
                const forCurrentPeriodsData = await this.teamWorkloadProgessForSinglePeriods(lastFinancialYearData.id, lastFinancialYearData.financial_year_value, getCompany.id, allPendingPeriods, sourceIds, sourceIdName, subLocations);
                const activeDataOwnersLocationsForAllPeriods = new Set();
                const bottomDataEntryStaffForAllPeriods = forAllPeriodsData
                    .filter(user => user.totalAssignedQuestionForAnswered > 0)
                    .sort((a, b) => b.answerNotRespondedIds.length - a.answerNotRespondedIds.length)
                    .map((user, i) => {

                        if (!isNaN(Number(user?.sourceId)) && (user.answered > 0)) {
                            activeDataOwnersLocationsForAllPeriods.add(user.sourceId);
                        }

                        return {
                            serialNumber: i + 1,
                            name: `${user.firstName} ${user.lastName}`,
                            totalRecords: user.answerNotRespondedIds.length.toLocaleString(),
                            totalAssignedQuestionForAnswered: user.totalAssignedQuestionForAnswered,
                            answered: user.answered,
                            unitCode: user.unitCode,
                            answerNotResponded: user.answerNotResponded,
                            completionPercentage: (
                                (user.answered / user.totalAssignedQuestionForAnswered) * 100
                            ).toFixed(2),
                        };
                    });

                const activeAditorsLocationsForAllPeriods = new Set();
                const bottomAuditorsForAllPeriods = forAllPeriodsData
                    .filter(user => user.totalAssignedQuestionForAudit > 0)
                    .sort((a, b) => b.auditorNotRespondedIds.length - a.auditorNotRespondedIds.length)
                    .map((user, i) => {
                        if (!isNaN(Number(user?.sourceId)) && (user.accepted > 0 || user.rejected > 0)) {
                            activeAditorsLocationsForAllPeriods.add(user.sourceId);
                        }

                        return {
                            serialNumber: i + 1,
                            name: `${user.firstName} ${user.lastName}`,
                            totalAudits: user.auditorNotRespondedIds.length.toLocaleString(),
                            totalAssignedQuestionForAudit: user.totalAssignedQuestionForAudit,
                            accepted: user.accepted,
                            unitCode: user.unitCode,
                            rejected: user.rejected,
                            auditorNotResponded: user.auditorNotResponded,
                            auditCompletionPercentage: (
                                (user.accepted / user.totalAssignedQuestionForAudit) * 100
                            ).toFixed(2),
                        };
                    });

                const activeDataOwnersLocationsCurrentAllPeriods = new Set();
                const bottomDataEntryStaffForCurrentPeriods = forCurrentPeriodsData
                    .filter(user => user.totalAssignedQuestionForAnswered > 0)
                    .sort((a, b) => b.answerNotRespondedIds.length - a.answerNotRespondedIds.length)
                    .map((user, i) => {
                        if (!isNaN(Number(user?.sourceId)) && (user.answered > 0)) {
                            activeDataOwnersLocationsCurrentAllPeriods.add(user.sourceId);
                        }

                        return {
                            serialNumber: i + 1,
                            name: `${user.firstName} ${user.lastName}`,
                            totalRecords: user.answerNotRespondedIds.length.toLocaleString(),
                            totalAssignedQuestionForAnswered: user.totalAssignedQuestionForAnswered,
                            answered: user.answered,
                            unitCode: user.unitCode,
                            answerNotResponded: user.answerNotResponded,
                            completionPercentage: (
                                (user.answered / user.totalAssignedQuestionForAnswered) * 100
                            ).toFixed(2),
                        };
                    });

                const activeAditorsLocationsForCurrentPeriods = new Set();
                const bottomAuditorsForCurrentPeriods = forCurrentPeriodsData
                    .filter(user => user.totalAssignedQuestionForAudit > 0)
                    .sort((a, b) => b.auditorNotRespondedIds.length - a.auditorNotRespondedIds.length)
                    .map((user, i) => {
                        if (!isNaN(Number(user?.sourceId)) && (user.accepted > 0 || user.rejected > 0)) {
                            activeAditorsLocationsForCurrentPeriods.add(user.sourceId);
                        }

                        return {
                            serialNumber: i + 1,
                            name: `${user.firstName} ${user.lastName}`,
                            totalAudits: user.auditorNotRespondedIds.length.toLocaleString(),
                            totalAssignedQuestionForAudit: user.totalAssignedQuestionForAudit,
                            accepted: user.accepted,
                            rejected: user.rejected,
                            unitCode: user.unitCode,
                            auditorNotResponded: user.auditorNotResponded,
                            auditCompletionPercentage: (
                                (user.accepted / user.totalAssignedQuestionForAudit) * 100
                            ).toFixed(2),
                        };
                    });

                const totalAnswerPending = forAllPeriodsData.reduce((sum, user) => sum + user.answerNotResponded, 0);
                const totalAuditPending = forAllPeriodsData.reduce((sum, user) => sum + user.auditorNotResponded, 0);

                const activeDataEntryStaff = forAllPeriodsData.filter(user => user.totalAssignedQuestionForAnswered > 0).length;
                const activeAuditors = forAllPeriodsData.filter(user => user.totalAssignedQuestionForAudit > 0).length;

                const dataOwnersWithPending = forAllPeriodsData.filter(user => user.answerNotResponded > 0).length;
                const auditorsWithPendingAudits = forAllPeriodsData.filter(user => user.auditorNotResponded > 0).length;

                const currentTotalAnswerPending = forCurrentPeriodsData.reduce((sum, user) => sum + user.answerNotResponded, 0);
                const currentTotalAuditPending = forCurrentPeriodsData.reduce((sum, user) => sum + user.auditorNotResponded, 0);
                const currentActiveDataEntryStaff = forCurrentPeriodsData.filter(user => user.totalAssignedQuestionForAnswered > 0).length;
                const currentActiveAuditors = forCurrentPeriodsData.filter(user => user.totalAssignedQuestionForAudit > 0).length;
                const currentDataOwnersWithPending = forCurrentPeriodsData.filter(user => user.answerNotResponded > 0).length;
                const currentAuditorsWithPendingAudits = forCurrentPeriodsData.filter(user => user.auditorNotResponded > 0).length;

                const topDataOwners = forCurrentPeriodsData
                    .filter(user => user.answerNotResponded > 0)
                    .sort((a, b) => b.answerNotResponded - a.answerNotResponded)
                    .slice(0, 10)
                    .map((user, index) => {
                        const daysPending = Math.floor(Math.random() * 30) + 1;
                        const priorityLevel = user.answerNotResponded > 100 ? 'High' : user.answerNotResponded > 50 ? 'Medium' : 'Low';
                        const priorityClass = priorityLevel.toLowerCase();

                        return {
                            rank: index + 1,
                            name: `${user.firstName} ${user.lastName}`,
                            location: "Location N/A",
                            pendingQuestions: user.answerNotResponded,
                            daysPending: daysPending,
                            priorityLevel: priorityLevel,
                            priorityClass: priorityClass
                        };
                    });

                const topAuditors = forCurrentPeriodsData
                    .filter(user => user.auditorNotResponded > 0)
                    .sort((a, b) => b.auditorNotResponded - a.auditorNotResponded)
                    .slice(0, 10)
                    .map((user, index) => {
                        const daysPending = remDays;
                        const priorityLevel = user.auditorNotResponded > 50 ? 'Critical' :
                            user.auditorNotResponded > 30 ? 'High' :
                                user.auditorNotResponded > 15 ? 'Medium' : 'Low';
                        const priorityClass = priorityLevel.toLowerCase();

                        return {
                            rank: index + 1,
                            name: `${user.firstName} ${user.lastName}`,
                            location: "Location N/A",
                            pendingQuestions: user.auditorNotResponded,
                            daysPending: daysPending,
                            priorityLevel: priorityLevel,
                            priorityClass: priorityClass
                        };
                    });

                const totalAuditors = forAllPeriodsData.length;
                const currentTotalAuditors = forCurrentPeriodsData.length;
                const averageAuditsPerAuditor = currentActiveAuditors > 0 ? (currentTotalAuditPending / currentActiveAuditors).toFixed(1) : "0";
                const activityRate = forCurrentPeriodsData.length > 0 ?
                    ((forCurrentPeriodsData.filter(user => user.answered > 0 || user.accepted > 0).length / forCurrentPeriodsData.length) * 100).toFixed(1) : "0";

                const criticalIssues = [];
                const criticalAuditors = topAuditors.filter(auditor => auditor.priorityLevel === 'Critical');
                const highPendingDataOwners = topDataOwners.filter(owner => owner.pendingQuestions > 100);

                if (criticalAuditors.length > 0) {
                    criticalIssues.push({
                        title: `${criticalAuditors[0].name} (Auditor)`,
                        description: `${criticalAuditors[0].pendingQuestions} pending audits - Performance review required`
                    });
                }

                if (highPendingDataOwners.length > 0) {
                    criticalIssues.push({
                        title: `${highPendingDataOwners[0].name} (Data Owner)`,
                        description: `${highPendingDataOwners[0].pendingQuestions} pending questions - Follow-up needed`
                    });
                }

                if (dataOwnersWithPending > forAllPeriodsData.length * 0.3) {
                    criticalIssues.push({
                        title: "Pending Work Growth",
                        description: "High percentage of team members with pending work - resource allocation review needed"
                    });
                }

                const currentDate = new Date();
                const generatedDate = currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                const formatDate = (dateStr: string) => {
                    const date = new Date(dateStr);
                    return date.toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric"
                    });
                };

                const reportingPeriod =
                    `${formatDate(`${actualNotification.periodRecord.fromDate}-01`)} - ${formatDate(actualNotification.periodRecord.calToDate)}`;

                const reportData = {
                    reportingPeriod: reportingPeriod,
                    generatedDate: generatedDate,
                    reportType: "Overall Summary & Current Period Progress",
                    summaryPeriodText: `${allPendingPeriods.length}`,
                    timeframeText: `${allPendingPeriods.length} Periods`,
                    reportSubject: `Performance Tracking Report - ${this.getReportingPeriodString(actualNotification.periodRecord)}`,
                    bottomDataEntryStaff: bottomDataEntryStaffForAllPeriods,
                    bottomAuditors: bottomAuditorsForAllPeriods,
                    totalAuditPending: totalAuditPending.toLocaleString(),
                    auditPendingStatus: totalAuditPending < 200 ? "improving" : totalAuditPending > 500 ? "attention" : "stable",
                    auditPendingChange: `${totalAuditPending} total pending audits`,
                    totalAnswerPending: totalAnswerPending.toLocaleString(),
                    answerPendingStatus: totalAnswerPending < 3000 ? "improving" : totalAnswerPending > 5000 ? "attention" : "stable",
                    answerPendingChange: `${totalAnswerPending} total pending answers`,
                    activeDataOwnersLocationsForAllPeriods: (activeDataOwnersLocationsForAllPeriods.size).toString(),
                    activeAuditorsLocationsForAllPeriods: (activeAditorsLocationsForAllPeriods.size).toString(),
                    totalLocations: (sourceIds.length).toString(),
                    locationsStatus: "stable",
                    locationsChangeDataOwner: `${activeDataOwnersLocationsForAllPeriods.size} total location active`,
                    locationsChangeAuditor: `${activeAditorsLocationsForAllPeriods.size} total location active`,


                    bottomDataEntryStaffForCurrentPeriods: bottomDataEntryStaffForCurrentPeriods,
                    bottomAuditorsForCurrentPeriods: bottomAuditorsForCurrentPeriods,
                    totalAuditPendingForCurrentPeriods: currentTotalAuditPending.toLocaleString(),
                    auditPendingStatusForCurrentPeriods: currentTotalAuditPending < 200 ? "improving" : currentTotalAuditPending > 500 ? "attention" : "stable",
                    auditPendingChangeForCurrentPeriods: `${currentTotalAuditPending} total pending audits`,
                    totalAnswerPendingForCurrentPeriods: currentTotalAnswerPending.toLocaleString(),
                    answerPendingStatusForCurrentPeriods: currentDataOwnersWithPending < 3000 ? "improving" : currentDataOwnersWithPending > 5000 ? "attention" : "stable",
                    answerPendingChangeForCurrentPeriods: `${currentTotalAnswerPending} total pending answers`,
                    activeDataOwnersLocationsForCurrentPeriods: (activeDataOwnersLocationsCurrentAllPeriods.size).toString(),
                    activeAuditorsLocationsForCurrentPeriods: (activeAditorsLocationsForCurrentPeriods.size).toString(),
                    totalLocationsForCurrentPeriods: (sourceIds.length).toString(),
                    locationsStatusForCurrentPeriods: "stable",
                    locationsChangeDataOwnerForCurrentPeriods: `${activeDataOwnersLocationsCurrentAllPeriods.size} total location active`,
                    locationsChangeAuditorForCurrentPeriods: `${activeAditorsLocationsForCurrentPeriods.size} total location active`,

                    dataOwnersWithPending: dataOwnersWithPending.toString(),
                    dataOwnersStatus: dataOwnersWithPending > forAllPeriodsData.length * 0.3 ? "attention" : "stable",
                    dataOwnersChange: `${((dataOwnersWithPending / forAllPeriodsData.length) * 100).toFixed(1)}% of total staff`,
                    totalPendingQuestions: totalAnswerPending.toLocaleString(),
                    pendingQuestionsStatus: "stable",
                    pendingQuestionsChange: `${totalAnswerPending} questions pending`,
                    auditorsWithPendingAudits: auditorsWithPendingAudits.toString(),
                    auditorsWithPendingStatus: auditorsWithPendingAudits > activeAuditors * 0.5 ? "attention" : "stable",
                    auditorsWithPendingChange: `${((auditorsWithPendingAudits / activeAuditors) * 100).toFixed(1)}% of auditors`,
                    totalPendingAuditQuestions: totalAuditPending.toLocaleString(),
                    pendingAuditQuestionsStatus: totalAuditPending > 200 ? "attention" : "stable",
                    pendingAuditQuestionsChange: `${totalAuditPending} audit questions pending`,

                    totalDataOwners: forCurrentPeriodsData.length.toString(),
                    totalDataOwnersStatus: "stable",
                    totalDataOwnersChange: `${forCurrentPeriodsData.length} total team members`,
                    dataOwnersWithPendingCurrent: currentDataOwnersWithPending.toString(),
                    dataOwnersWithPendingCurrentStatus: currentDataOwnersWithPending > forCurrentPeriodsData.length * 0.3 ? "attention" : "stable",
                    dataOwnersWithPendingCurrentChange: `${currentDataOwnersWithPending} members with pending work`,
                    totalPendingQuestionsCurrent: currentTotalAnswerPending.toLocaleString(),
                    totalPendingQuestionsCurrentStatus: "stable",
                    totalPendingQuestionsCurrentChange: `${currentTotalAnswerPending} questions`,

                    topDataOwners: topDataOwners,

                    mostActiveDataOwners: forCurrentPeriodsData.filter(user => user.answered > 0).length.toString(),
                    activityRate: activityRate,
                    criticalCasesDataOwners: topDataOwners.filter(owner => owner.priorityLevel === 'High' && owner.pendingQuestions > 100).length.toString(),
                    highPriorityCasesDataOwners: topDataOwners.filter(owner => owner.priorityLevel === 'High').length.toString(),
                    newDataOwnersAdded: "N/A", // You'll need historical data to calculate this

                    totalAuditors: currentTotalAuditors.toString(),
                    totalAuditorsStatus: "stable",
                    totalAuditorsChange: `${currentTotalAuditors} total auditors`,
                    auditorsWithPendingAuditsCurrent: currentAuditorsWithPendingAudits.toString(),
                    auditorsWithPendingAuditsCurrentStatus: currentAuditorsWithPendingAudits > currentActiveAuditors * 0.5 ? "attention" : "stable",
                    auditorsWithPendingAuditsCurrentChange: `${currentAuditorsWithPendingAudits} auditors with pending work`,
                    totalPendingAuditsCurrent: currentTotalAuditPending.toLocaleString(),
                    totalPendingAuditsCurrentStatus: currentTotalAuditPending < 200 ? "improving" : "attention",
                    totalPendingAuditsCurrentChange: `${currentTotalAuditPending} pending audits`,

                    topAuditors: topAuditors,

                    averageAuditsPerAuditor: averageAuditsPerAuditor,
                    criticalCasesAuditors: topAuditors.filter(auditor => auditor.priorityLevel === 'Critical').length.toString(),
                    highPriorityCasesAuditors: topAuditors.filter(auditor => auditor.priorityLevel === 'High').length.toString(),
                    mostProductiveCoverage: currentActiveAuditors.toString(),
                    workloadDistribution: currentAuditorsWithPendingAudits.toString(),

                    criticalIssues: criticalIssues,

                    keyPerformanceIndicators: [
                        {
                            title: "Current Period Workload",
                            description: `${currentDataOwnersWithPending} data owners and ${currentAuditorsWithPendingAudits} auditors with pending work this period`
                        },
                        {
                            title: "Cumulative Pending Work",
                            description: `${totalAnswerPending} total pending answers, ${totalAuditPending} total pending audits across all periods`
                        },
                        {
                            title: "Current Period Activity Rate",
                            description: `${activityRate}% of team members are actively contributing this period`
                        }
                    ],

                    preparedBy: "Admin User",
                    nextReportDate: new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),

                };
                const results = [];

                for (const user of allAdmin) {
                    const performanceReportPayload = {
                        emailData: {
                            userDetails: user,
                            templatePath: '/../../../public/views/templates/admin-reminder.html',
                            subject: `Performance Tracking Report - ${currentDate.toLocaleDateString('en-US', {
                                month: 'long',
                                year: 'numeric',
                            })}`,
                            reportData: reportData,
                        },
                    };

                    const emailHistory = await this.userDaoService.insertNewEmailHistory(
                        isDebug ? debugTo : user.email,
                        'PERFORMANCE_REPORT_ADMIN',
                        false,
                        performanceReportPayload,
                        actualNotification.ccList,
                    );

                    const emailStatus = await this.sendMailService.sendEmailReport(
                        isDebug ? debugTo : user.email,
                        actualNotification.ccList,
                        reportData.reportSubject,
                        user,
                        '/../../../public/views/templates/admin-reminder.html',
                        reportData,
                        'PERFORMANCE_REPORT',
                        []
                    );

                    await this.userDaoService.updateStatusEmailHistory(
                        emailHistory.id,
                        emailStatus
                    );

                    results.push({
                        userId: user.id
                    });

                }
                await this.emailNotificationsAndDueDateDaoService.updateStatusAndUser(actualNotification.id, results, 'sent' as EmailNotificationsStatus)
                return {
                    success: true,
                    message: 'Performance report sent successfully to all admins',
                    reportData,
                };

            }

        } catch (error) {
            throw new BadRequestException(`Failed to send performance report: ${error.message}`);
        }
    }

    async dataOwnerReportToUser(isDebug, debugTo) {
        try {
            const getCompany = await this.userDaoService.getHeadOfficeCompanyDetails(true);
            type FinancialYear = { id: number; financial_year_value: string };
            const financialYearData: { data: FinancialYear[] } = await this.externalApiCallService.getReq(
                process.env.COMPANY_SERVER_API_URL + 'getFinancialYear',
                { userId: getCompany.company_id, type: 'COMPANY' },
                {},
            );
            const lastFinancialYearData = financialYearData.data[financialYearData.data.length - 1];
            const financialYearValue = financialYearData.data.find(
                (fy: FinancialYear) => fy.id === lastFinancialYearData.id
            )?.financial_year_value || "Not Found";
            const periods = await this.generatePeriods(getCompany?.frequency, getCompany?.starting_month, financialYearValue);
            const actualNotifications = await this.emailNotificationsAndDueDateDaoService.getEmailNotifications('dataOwner' as NotificationsTypeEnum);
            if (actualNotifications.length) {
                const actualNotification = actualNotifications[0]
                const dueDate = await this.emailNotificationsAndDueDateDaoService.getPeriodDueDate(actualNotification.dueDateConfigId);
                const allPendingPeriods = periods.filter(p => p.fromDate <= actualNotification.periodRecord.fromDate);
                const start = (new Date(dueDate.fixedDate)).toDateString();
                const sourceIds = await this.sourceDaoService.getAllLocation();
                const forAllPeriodsData = await this.teamWorkloadProgesForEachPeriods(lastFinancialYearData.id, lastFinancialYearData.financial_year_value, getCompany.id, allPendingPeriods, sourceIds);
                function formatMonth(dateStr: string) {
                    const [year, month] = dateStr.split("-");
                    const d = new Date(Number(year), Number(month) - 1);
                    return d.toLocaleString("en-US", { month: "long", year: "numeric" });
                }

                function findData(dateStr: string, user: any) {
                    const periodsData = forAllPeriodsData.find(
                        (item) => item.userId === user.userId && item.fromDate === dateStr
                    );

                    if (!periodsData) {
                        return {
                            month: formatMonth(dateStr),
                            questionsAssigned: "0",
                            questionsAnswered: "0",
                            questionsPending: "0",
                        };
                    }

                    return {
                        month: formatMonth(dateStr),
                        questionsAssigned: periodsData.totalAssignedQuestionForAnswered.toString(),
                        questionsAnswered: periodsData.answered.toString(),
                        questionsPending: periodsData.answerNotResponded.toString(),
                    };

                }
                const sourceIdName = await this.sourceDaoService.getAllLocationName();
                const subLocations = await this.sourceDaoService.getSubSourceBasedOnIds();

                const forCurrentPeriodsData = await this.teamWorkloadProgessForSinglePeriods(lastFinancialYearData.id, lastFinancialYearData.financial_year_value, getCompany.id, allPendingPeriods, sourceIds, sourceIdName, subLocations);
                const results = [];
                for (let user of forCurrentPeriodsData) {
                    if (user.finalAssgnedQuestionIds.length > 0) {

                        const reportData = {
                            // Header Information
                            dataOwnerName: `${user.firstName} ${user.lastName}`,
                            fromTeam: "Admin Team",
                            reportDate: new Date().toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                            }),
                            reportSubject: `Your ${actualNotification.periodRecord.displayName} ${financialYearValue} Performance Summary & Pending Questions Update`,
                            reportPeriod: `${actualNotification.periodRecord.displayName} ${financialYearValue}`,

                            // Performance Metrics
                            questionsReceived: user.finalAssgnedQuestionIds.length,
                            questionsAnswered: user.answered,
                            pendingQuestions: user.answerNotResponded,
                            dueDate: start,

                            // // Immediate Action Questions (High Priority)
                            // immediateActionQuestions: [
                            //     {
                            //         questionId: "Q-7234",
                            //         category: "Customer Inquiry",
                            //         daysPending: "12",
                            //         priority: "High",
                            //         priorityClass: "high",
                            //         dueDate: "Aug 5, 2024"
                            //     },
                            //     {
                            //         questionId: "Q-7189",
                            //         category: "Data Verification",
                            //         daysPending: "8",
                            //         priority: "Medium",
                            //         priorityClass: "medium",
                            //         dueDate: "Aug 7, 2024"
                            //     },
                            //     {
                            //         questionId: "Q-7156",
                            //         category: "Process Update",
                            //         daysPending: "6",
                            //         priority: "Medium",
                            //         priorityClass: "medium",
                            //         dueDate: "Aug 9, 2024"
                            //     }
                            // ],

                            // // Weekly Priority Questions (This Week)
                            // weeklyPriorityQuestions: [
                            //     {
                            //         questionId: "Q-7298",
                            //         category: "System Access",
                            //         daysPending: "4",
                            //         priority: "Low",
                            //         priorityClass: "low",
                            //         dueDate: "Aug 12, 2024"
                            //     },
                            //     {
                            //         questionId: "Q-7301",
                            //         category: "Documentation",
                            //         daysPending: "3",
                            //         priority: "Low",
                            //         priorityClass: "low",
                            //         dueDate: "Aug 14, 2024"
                            //     }
                            // ],

                            // Summary Metrics
                            // totalPending: "18",
                            // overdueQuestions: "1",
                            // thisWeekQuestions: "5",

                            // Monthly Trends (Last 3 months)
                            monthlyTrends: allPendingPeriods.map((item) =>
                                findData(item.fromDate, user)
                            ),

                            // Footer Information
                            location: "Downtown Branch A",
                            dataOwnerEmail: "robert.chen@company.com",
                            nextReportDate: "September 2, 2024",
                            contactEmail: "admin@company.com",
                        };
                        // Create payload for email history
                        const dataOwnerReportPayload = {
                            emailData: {
                                userDetails: user,
                                templatePath: '/../../../public/views/templates/data_owner_report.html',
                                subject: `Your ${reportData.reportPeriod} Performance Summary & Pending Questions Update`,
                                reportData: reportData
                            },
                        };


                        const emailHistory = await this.userDaoService.insertNewEmailHistory(
                            isDebug ? debugTo : user.email,
                            'DATA_OWNER_REPORT_SEND',
                            false,
                            dataOwnerReportPayload,
                            actualNotification.ccList,
                        );

                        // Option 1: Use the common function directly
                        const emailStatus = await this.sendMailService.sendEmailReport(
                            isDebug ? debugTo : user.email,
                            actualNotification.ccList,
                            reportData.reportSubject,
                            user,
                            '/../../../public/views/templates/data-owner-reminder.html',
                            reportData,
                            'DATA_OWNER_REPORT',
                            []
                        );

                        await this.userDaoService.updateStatusEmailHistory(
                            emailHistory.id,
                            emailStatus
                        );

                        results.push({
                            userId: user.userId
                        });

                        // Send to first two data owner's only in debug mode
                        if (isDebug && results.length === 2) {
                            break;
                        }
                    }


                }
                await this.emailNotificationsAndDueDateDaoService.updateStatusAndUser(actualNotification.id, results, 'sent' as EmailNotificationsStatus)
                return {
                    success: true,
                    message: 'Performance report sent successfully to all Data Owner',
                };
            }
        } catch (error) {
            throw new BadRequestException(`Failed to send auditor appreciation email: ${error.message}`);
        }
    }

    async auditorReportToUser(isDebug, debugTo) {
        try {
            const getCompany = await this.userDaoService.getHeadOfficeCompanyDetails(true);
            type FinancialYear = { id: number; financial_year_value: string };
            const financialYearData: { data: FinancialYear[] } = await this.externalApiCallService.getReq(
                process.env.COMPANY_SERVER_API_URL + 'getFinancialYear',
                { userId: getCompany.company_id, type: 'COMPANY' },
                {},
            );
            const lastFinancialYearData = financialYearData.data[financialYearData.data.length - 1];
            const financialYearValue = financialYearData.data.find(
                (fy: FinancialYear) => fy.id === lastFinancialYearData.id
            )?.financial_year_value || "Not Found";
            const periods = await this.generatePeriods(getCompany?.frequency, getCompany?.starting_month, financialYearValue);
            const actualNotifications = await this.emailNotificationsAndDueDateDaoService.getEmailNotifications('auditor' as NotificationsTypeEnum);
            if (actualNotifications.length) {
                const actualNotification = actualNotifications[0]
                const dueDate = await this.emailNotificationsAndDueDateDaoService.getPeriodDueDate(actualNotification.dueDateConfigId);
                const allPendingPeriods = periods.filter(p => p.fromDate <= actualNotification.periodRecord.fromDate);
                const start = (new Date(dueDate.fixedDate)).toDateString();
                const sourceIds = await this.sourceDaoService.getAllLocation();
                const forAllPeriodsData = await this.teamWorkloadProgesForEachPeriods(lastFinancialYearData.id, lastFinancialYearData.financial_year_value, getCompany.id, allPendingPeriods, sourceIds);
                function formatMonth(dateStr: string) {
                    const [year, month] = dateStr.split("-");
                    const d = new Date(Number(year), Number(month) - 1);
                    return d.toLocaleString("en-US", { month: "long", year: "numeric" });
                }

                function findData(dateStr: string, user: any) {
                    const periodsData = forAllPeriodsData.find(
                        (item) => item.userId === user.userId && item.fromDate === dateStr
                    );

                    if (!periodsData) {
                        return {
                            month: formatMonth(dateStr),
                            questionsAssigned: "0",
                            questionsAnswered: "0",
                            questionsPending: "0",
                        };
                    }

                    return {
                        month: formatMonth(dateStr),
                        questionsAssigned: periodsData.totalAssignedQuestionForAudit.toString(),
                        questionsAccepted: periodsData.accepted.toString(),
                        questionsRejected: periodsData.rejected.toString(),
                        questionsPending: periodsData.auditorNotResponded.toString(),
                    };

                }
                const sourceIdName = await this.sourceDaoService.getAllLocationName();
                const subLocations = await this.sourceDaoService.getSubSourceBasedOnIds();

                const forCurrentPeriodsData = await this.teamWorkloadProgessForSinglePeriods(lastFinancialYearData.id, lastFinancialYearData.financial_year_value, getCompany.id, allPendingPeriods, sourceIds, sourceIdName, subLocations);
                const results = [];
                for (let user of forCurrentPeriodsData) {
                    if (user.totalAssignedQuestionForAudit > 0) {

                        const reportData = {
                            auditorName: `${user.firstName} ${user.lastName}`,
                            fromTeam: "Admin Team",
                            reportDate: new Date().toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                            }),
                            reportSubject: `Your ${actualNotification.periodRecord.displayName} ${financialYearValue} Performance Summary & Pending Audit Update`,
                            reportPeriod: `${actualNotification.periodRecord.displayName} ${financialYearValue}`,


                            auditsAssigned: (user.totalAssignedQuestionForAudit).toString(),
                            auditsCompleted: (user.accepted + user.rejected).toString(),
                            pendingAudits: (user.auditorNotResponded).toString(),
                            dueDate: start,

                            monthlyTrends: allPendingPeriods.map((item) =>
                                findData(item.fromDate, user)
                            ),
                        };
                        // Create payload for email history
                        const dataOwnerReportPayload = {
                            emailData: {
                                userDetails: user,
                                templatePath: '/../../../public/views/templates/auditor-reminder.html',
                                subject: `Your ${reportData.reportPeriod} Performance Summary & Pending Questions Update`,
                                reportData: reportData
                            },
                        };

                        // Insert email history
                        const emailHistory = await this.userDaoService.insertNewEmailHistory(
                            isDebug ? debugTo : user.email,
                            'AUDITOR_REPORT_SEND',
                            false,
                            dataOwnerReportPayload,
                            actualNotification.ccList,
                        );

                        // Option 1: Use the common function directly
                        const emailStatus = await this.sendMailService.sendEmailReport(
                            isDebug ? debugTo : user.email,
                            actualNotification.ccList,
                            reportData.reportSubject,
                            user,
                            '/../../../public/views/templates/auditor-reminder.html',
                            reportData,
                            'AUDITOR_REPORT',
                            []
                        );
                        await this.userDaoService.updateStatusEmailHistory(
                            emailHistory.id,
                            emailStatus
                        );

                        results.push({
                            userId: user.id
                        });

                        // Send to first two data owner's only in debug mode
                        if (isDebug && results.length === 2) {
                            break;
                        }

                    }
                }
                await this.emailNotificationsAndDueDateDaoService.updateStatusAndUser(actualNotification.id, results, 'sent' as EmailNotificationsStatus)
                return {
                    success: true,
                    message: 'Performance report sent successfully to all Auditor',
                };
            }
        } catch (error) {
            throw new BadRequestException(`Failed to send auditor appreciation email: ${error.message}`);
        }
    }

    async sendDataOwnerAppreciationToUsers(isDebug, debugTo) {
        try {
            const getCompany = await this.userDaoService.getHeadOfficeCompanyDetails(true);
            type FinancialYear = { id: number; financial_year_value: string };
            const financialYearData: { data: FinancialYear[] } = await this.externalApiCallService.getReq(
                process.env.COMPANY_SERVER_API_URL + 'getFinancialYear',
                { userId: getCompany.company_id, type: 'COMPANY' },
                {},
            );
            const lastFinancialYearData = financialYearData.data[financialYearData.data.length - 1];
            const financialYearValue = financialYearData.data.find(
                (fy: FinancialYear) => fy.id === lastFinancialYearData.id
            )?.financial_year_value || "Not Found";
            const periods = await this.generatePeriods(getCompany?.frequency, getCompany?.starting_month, financialYearValue);
            const actualNotifications = await this.emailNotificationsAndDueDateDaoService.getEmailNotifications('dataOwnerAppreciation' as NotificationsTypeEnum);
            if (actualNotifications.length) {

                const actualNotification = actualNotifications[0]
                const dueDate = await this.emailNotificationsAndDueDateDaoService.getPeriodDueDate(actualNotification.dueDateConfigId);
                const allPendingPeriods = periods.filter(p => p.fromDate <= actualNotification.periodRecord.fromDate);
                const start = (new Date(dueDate.fixedDate)).toDateString();
                const sourceIds = await this.sourceDaoService.getAllLocation();
                const forAllPeriodsData = await this.teamWorkloadProgesForEachPeriods(lastFinancialYearData.id, lastFinancialYearData.financial_year_value, getCompany.id, allPendingPeriods, sourceIds);
                function formatMonth(dateStr: string) {
                    const [year, month] = dateStr.split("-");
                    const d = new Date(Number(year), Number(month) - 1);
                    return d.toLocaleString("en-US", { month: "long", year: "numeric" });
                }

                function findData(dateStr: string, user: any) {
                    const periodsData = forAllPeriodsData.find(
                        (item) => item.userId === user.userId && item.fromDate === dateStr
                    );

                    if (!periodsData) {
                        return {
                            month: formatMonth(dateStr),
                            questionsAssigned: "0",
                            questionsAnswered: "0",
                            questionsPending: "0",
                        };
                    }

                    return {
                        month: formatMonth(dateStr),
                        questionsAssigned: periodsData.totalAssignedQuestionForAnswered.toString(),
                        questionsAnswered: periodsData.answered.toString(),
                        questionsPending: periodsData.answerNotResponded.toString(),
                    };

                }
                const sourceIdName = await this.sourceDaoService.getAllLocationName();
                const subLocations = await this.sourceDaoService.getSubSourceBasedOnIds();

                const forCurrentPeriodsData = await this.teamWorkloadProgessForSinglePeriods(lastFinancialYearData.id, lastFinancialYearData.financial_year_value, getCompany.id, allPendingPeriods, sourceIds, sourceIdName, subLocations);
                const results = [];
                for (let user of forCurrentPeriodsData) {
                    if (user.finalAssgnedQuestionIds.length > 0) {

                        if (Number(user.percentageAnsweredUnresponded) === 100) {
                            const reportData = {
                                auditorName: `${user.firstName} ${user.lastName}`,
                                fromTeam: "Admin Team",
                                reportDate: new Date().toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                }),
                                reportSubject: "🌟 Outstanding Achievement - All Questions Completed!",

                                reportPeriod: `${actualNotification.periodRecord.displayName} ${financialYearValue}`,
                                questionsAssigned: user.finalAssgnedQuestionIds.length,
                                questionsCompleted: user.answered,
                                pendingQuestions: user.answerNotResponded,
                                completionRate: user.percentageAnswered,

                                achievementTitle: "Zero Pending Champion",
                                achievementDescription: "100% Question Completion Rate",

                                auditorEmail: user.email,
                                contactEmail: "contact.riu.ai",
                            };

                            const appreciationPayload = {
                                emailData: {
                                    userDetails: user,
                                    templatePath: '/../../../public/views/templates/data-owner-appreciation.html',
                                    subject: reportData.reportSubject,
                                    reportData: reportData
                                },
                            };

                            const emailHistory = await this.userDaoService.insertNewEmailHistory(
                                isDebug ? debugTo : user.email,
                                'DATA_OWNER_APPRECIATION_SEND',
                                false,
                                appreciationPayload,
                                actualNotification.ccList,
                            );

                            const emailStatus = await this.sendMailService.sendEmailReport(
                                isDebug ? debugTo : user.email,
                                actualNotification.ccList,
                                reportData.reportSubject,
                                user,
                                '/../../../public/views/templates/data-owner-appreciation.html',
                                reportData,
                                'DATA_OWNER_APPRECIATION',
                                []
                            );

                            await this.userDaoService.updateStatusEmailHistory(
                                emailHistory.id,
                                emailStatus
                            );

                            results.push({
                                userId: user.id
                            });

                        } else {
                            const reportData = {
                                // Header Information
                                dataOwnerName: `${user.firstName} ${user.lastName}`,
                                fromTeam: "Admin Team",
                                reportDate: new Date().toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                }),
                                reportSubject: `Your ${actualNotification.periodRecord.displayName} ${financialYearValue} Performance Summary & Pending Questions Update`,
                                reportPeriod: `${actualNotification.periodRecord.displayName} ${financialYearValue}`,

                                // Performance Metrics
                                questionsReceived: user.finalAssgnedQuestionIds.length,
                                questionsAnswered: user.answered,
                                pendingQuestions: user.answerNotResponded,
                                dueDate: start,

                                // // Immediate Action Questions (High Priority)
                                // immediateActionQuestions: [
                                //     {
                                //         questionId: "Q-7234",
                                //         category: "Customer Inquiry",
                                //         daysPending: "12",
                                //         priority: "High",
                                //         priorityClass: "high",
                                //         dueDate: "Aug 5, 2024"
                                //     },
                                //     {
                                //         questionId: "Q-7189",
                                //         category: "Data Verification",
                                //         daysPending: "8",
                                //         priority: "Medium",
                                //         priorityClass: "medium",
                                //         dueDate: "Aug 7, 2024"
                                //     },
                                //     {
                                //         questionId: "Q-7156",
                                //         category: "Process Update",
                                //         daysPending: "6",
                                //         priority: "Medium",
                                //         priorityClass: "medium",
                                //         dueDate: "Aug 9, 2024"
                                //     }
                                // ],

                                // // Weekly Priority Questions (This Week)
                                // weeklyPriorityQuestions: [
                                //     {
                                //         questionId: "Q-7298",
                                //         category: "System Access",
                                //         daysPending: "4",
                                //         priority: "Low",
                                //         priorityClass: "low",
                                //         dueDate: "Aug 12, 2024"
                                //     },
                                //     {
                                //         questionId: "Q-7301",
                                //         category: "Documentation",
                                //         daysPending: "3",
                                //         priority: "Low",
                                //         priorityClass: "low",
                                //         dueDate: "Aug 14, 2024"
                                //     }
                                // ],

                                // Summary Metrics
                                // totalPending: "18",
                                // overdueQuestions: "1",
                                // thisWeekQuestions: "5",

                                // Monthly Trends (Last 3 months)
                                monthlyTrends: allPendingPeriods.map((item) =>
                                    findData(item.fromDate, user)
                                ),

                                // Footer Information
                                location: "Downtown Branch A",
                                dataOwnerEmail: "robert.chen@company.com",
                                nextReportDate: "September 2, 2024",
                                contactEmail: "admin@company.com",
                            };
                            // Create payload for email history
                            const dataOwnerReportPayload = {
                                emailData: {
                                    userDetails: user,
                                    templatePath: '/../../../public/views/templates/data_owner_report.html',
                                    subject: `Your ${reportData.reportPeriod} Performance Summary & Pending Questions Update`,
                                    reportData: reportData
                                },
                            };

                            // Insert email history
                            const emailHistory = await this.userDaoService.insertNewEmailHistory(
                                isDebug ? debugTo : user.email,
                                'DATA_OWNER_REPORT_SEND',
                                false,
                                dataOwnerReportPayload,
                                actualNotification.ccList,
                            );

                            // Option 1: Use the common function directly
                            const emailStatus = await this.sendMailService.sendEmailReport(
                                isDebug ? debugTo : user.email,
                                actualNotification.ccList,
                                reportData.reportSubject,
                                user,
                                '/../../../public/views/templates/data-owner-reminder.html',
                                reportData,
                                'DATA_OWNER_REPORT',
                                []
                            );

                            await this.userDaoService.updateStatusEmailHistory(
                                emailHistory.id,
                                emailStatus
                            );

                            results.push({
                                userId: user.id
                            });
                        }

                        // Send to first two data owner's only in debug mode
                        if (isDebug && results.length === 2) {
                            break;
                        }
                    }
                }
                await this.emailNotificationsAndDueDateDaoService.updateStatusAndUser(actualNotification.id, results, 'sent' as EmailNotificationsStatus)
                return {
                    success: true,
                    message: 'Performance report sent successfully to all Data Owner',
                };
            }


        } catch (error) {
            throw new BadRequestException(`Failed to send auditor appreciation email: ${error.message}`);
        }
    }

    async sendAuditorAppreciationToUsers(isDebug, debugTo) {
        try {
            const getCompany = await this.userDaoService.getHeadOfficeCompanyDetails(true);
            type FinancialYear = { id: number; financial_year_value: string };
            const financialYearData: { data: FinancialYear[] } = await this.externalApiCallService.getReq(
                process.env.COMPANY_SERVER_API_URL + 'getFinancialYear',
                { userId: getCompany.company_id, type: 'COMPANY' },
                {},
            );
            const lastFinancialYearData = financialYearData.data[financialYearData.data.length - 1];
            const financialYearValue = financialYearData.data.find(
                (fy: FinancialYear) => fy.id === lastFinancialYearData.id
            )?.financial_year_value || "Not Found";
            const periods = await this.generatePeriods(getCompany?.frequency, getCompany?.starting_month, financialYearValue);
            const actualNotifications = await this.emailNotificationsAndDueDateDaoService.getEmailNotifications('auditorAppreciation' as NotificationsTypeEnum);
            if (actualNotifications.length) {


                const actualNotification = actualNotifications[0]
                const dueDate = await this.emailNotificationsAndDueDateDaoService.getPeriodDueDate(actualNotification.dueDateConfigId);
                const allPendingPeriods = periods.filter(p => p.fromDate <= actualNotification.periodRecord.fromDate);
                const start = (new Date(dueDate.fixedDate)).toDateString();
                const sourceIds = await this.sourceDaoService.getAllLocation();
                const forAllPeriodsData = await this.teamWorkloadProgesForEachPeriods(lastFinancialYearData.id, lastFinancialYearData.financial_year_value, getCompany.id, allPendingPeriods, sourceIds);
                function formatMonth(dateStr: string) {
                    const [year, month] = dateStr.split("-");
                    const d = new Date(Number(year), Number(month) - 1);
                    return d.toLocaleString("en-US", { month: "long", year: "numeric" });
                }

                function findData(dateStr: string, user: any) {
                    const periodsData = forAllPeriodsData.find(
                        (item) => item.userId === user.userId && item.fromDate === dateStr
                    );

                    if (!periodsData) {
                        return {
                            month: formatMonth(dateStr),
                            questionsAssigned: "0",
                            questionsAnswered: "0",
                            questionsPending: "0",
                        };
                    }

                    return {
                        month: formatMonth(dateStr),
                        questionsAssigned: periodsData.totalAssignedQuestionForAudit.toString(),
                        questionsAccepted: periodsData.accepted.toString(),
                        questionsRejected: periodsData.rejected.toString(),
                        questionsPending: periodsData.auditorNotResponded.toString(),
                    };

                }
                const sourceIdName = await this.sourceDaoService.getAllLocationName();
                const subLocations = await this.sourceDaoService.getSubSourceBasedOnIds();

                const forCurrentPeriodsData = await this.teamWorkloadProgessForSinglePeriods(lastFinancialYearData.id, lastFinancialYearData.financial_year_value, getCompany.id, allPendingPeriods, sourceIds, sourceIdName, subLocations);
                const results = [];
                for (let user of forCurrentPeriodsData) {
                    if (user.totalAssignedQuestionForAudit > 0) {

                        if (Number(user.percentageAuditorUnresponded) === 100) {
                            const reportData = {
                                auditorName: `${user.firstName} ${user.lastName}`,
                                fromTeam: "Admin Team",
                                reportDate: new Date().toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                }),
                                reportSubject: "🌟 Outstanding Achievement - All Audits Completed!",
                                reportPeriod: `${actualNotification.periodRecord.displayName} ${financialYearValue}`,
                                auditsAssigned: user.totalAssignedQuestionForAudit,
                                auditsCompleted: user.finalAssignQuesionAccptedIds.length,
                                pendingAudits: user.totalAssignedQuestionForAudit - user.finalAssignQuesionAccptedIds.length,
                                completionRate: user.percentageAccepted,
                                achievementTitle: "Audit Excellence Champion",
                                achievementDescription: "100% Audit Completion Rate",
                                assignedLocations: "Riverside Unit, Westend Branch",
                                auditorEmail: user.email,
                                contactEmail: "contact.riu.ai",
                            };

                            const appreciationPayload = {
                                emailData: {
                                    userDetails: user,
                                    templatePath: '/../../../public/views/templates/auditor-appreciation.html',
                                    subject: reportData.reportSubject,
                                    reportData: reportData
                                },
                            };

                            const emailHistory = await this.userDaoService.insertNewEmailHistory(
                                isDebug ? debugTo : user.email,
                                'AUDITOR_APPRECIATION_SEND',
                                false,
                                appreciationPayload,
                                actualNotification.ccList,
                            );

                            const emailStatus = await this.sendMailService.sendEmailReport(
                                isDebug ? debugTo : user.email,
                                actualNotification.ccList,
                                reportData.reportSubject,
                                user,
                                '/../../../public/views/templates/auditor-appreciation.html',
                                reportData,
                                'AUDITOR_APPRECIATION',
                                []
                            );

                            await this.userDaoService.updateStatusEmailHistory(
                                emailHistory.id,
                                emailStatus
                            );

                            results.push({
                                userId: user.id
                            });


                        } else {
                            const reportData = {
                                auditorName: `${user.firstName} ${user.lastName}`,
                                fromTeam: "Admin Team",
                                reportDate: new Date().toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                }),
                                reportSubject: `Your ${actualNotification.periodRecord.displayName} ${financialYearValue} Performance Summary & Pending Audit Update`,
                                reportPeriod: `${actualNotification.periodRecord.displayName} ${financialYearValue}`,


                                auditsAssigned: (user.totalAssignedQuestionForAudit).toString(),
                                auditsCompleted: (user.accepted + user.rejected).toString(),
                                pendingAudits: (user.auditorNotResponded).toString(),
                                dueDate: start,

                                monthlyTrends: allPendingPeriods.map((item) =>
                                    findData(item.fromDate, user)
                                ),
                            };
                            // Create payload for email history
                            const dataOwnerReportPayload = {
                                emailData: {
                                    userDetails: user,
                                    templatePath: '/../../../public/views/templates/auditor-reminder.html',
                                    subject: `Your ${reportData.reportPeriod} Performance Summary & Pending Questions Update`,
                                    reportData: reportData
                                },
                            };

                            // Insert email history
                            const emailHistory = await this.userDaoService.insertNewEmailHistory(
                                isDebug ? debugTo : user.email,
                                'DATA_OWNER_REPORT_SEND',
                                false,
                                dataOwnerReportPayload,
                                actualNotification.ccList,
                            );

                            // Option 1: Use the common function directly
                            const emailStatus = await this.sendMailService.sendEmailReport(
                                isDebug ? debugTo : user.email,
                                actualNotification.ccList,
                                reportData.reportSubject,
                                user,
                                '/../../../public/views/templates/auditor-reminder.html',
                                reportData,
                                'AUDITOR_REPORT',
                                []
                            );

                            await this.userDaoService.updateStatusEmailHistory(
                                emailHistory.id,
                                emailStatus
                            );

                            results.push({
                                userId: user.id
                            });



                        }

                        // Send to first two data owner's only in debug mode
                        if (isDebug && results.length === 2) {
                            break;
                        }

                    }
                }
                await this.emailNotificationsAndDueDateDaoService.updateStatusAndUser(actualNotification.id, results, 'sent' as EmailNotificationsStatus)
                return {
                    success: true,
                    message: 'Performance report sent successfully to all Data Owner',
                };
            }


        } catch (error) {
            throw new BadRequestException(`Failed to send auditor appreciation email: ${error.message}`);
        }
    }

    async teamWorkloadProgess(financialYearId: number, financialYearValue: string, systemUserId: number, periods: any, sourceIds: any, sourceIdName: any, subLocations: any) {
        const fromDates = periods.map(p => p.fromDate);
        const array: string[] = fromDates;
        const userOrgChart = await this.findUserOrgChartData(systemUserId);

        const getCompany = await this.userDaoService.getHeadOfficeCompanyDetails(true);
        const frameworkIds = await this.getFrameworkIds(getCompany.company_id);

        const userIds = await this.extractUserIds(userOrgChart);
        const getUser = await this.userDaoService.getTeamUser(userIds);

        const getUsers = getUser.filter(obj => {
            const sourceIds = JSON.parse(obj.source_ids || "[]").map(Number);
            return sourceIds.some(id => (sourceIds).includes(id));
        });

        const queryParam = {
            company_id: getCompany.company_id,
            user_type_code: 'COMPANY',
            framework_ids: frameworkIds,
            qIds: undefined,
        };

        const getSectorQuestionResponse = await this.externalApiCallService.getReq(
            process.env.COMPANY_SERVER_API_URL + 'getReportingQuestion', queryParam, {},
        );


        const getSectorQuestion = getSectorQuestionResponse["data"];

        const questionIds = 
            new Set(
                getSectorQuestion
                    .filter(details => (details.questionId && !details.isFormulaBased))
                    .map(details => details.questionId)
            );

        const teamWorkloadResults = [];

        const filteredQuestionIdsForCUSTOM = [];
        const filteredQuestionIdsForEveryFY = [];
        getSectorQuestion.forEach(item => {
            if (!questionIds.has(item.questionId)) return;

            if (item.frequency === "CUSTOM") {
                for (let i = 0; i < array.length; i++) {
                    filteredQuestionIdsForCUSTOM.push(item.questionId);
                }
            } else {
                filteredQuestionIdsForEveryFY.push(item.questionId);
            }
        });

        const tmpansweredforEveryFY = await this.dashboardDaoService.answeredReportingAllIdsDataForEveryFY(Number(financialYearId), sourceIds, filteredQuestionIdsForEveryFY);
        const tmpansweredforEveryCustom = await this.dashboardDaoService.answeredReportingAllIdsDataForCustom(Number(financialYearId), array, sourceIds, filteredQuestionIdsForCUSTOM);
        const tmpanswered = [...tmpansweredforEveryFY.questionIds, ...tmpansweredforEveryCustom.questionIds];

        const totalAnsweredForThisPeriods = [...tmpansweredforEveryFY.answerIds, ...tmpansweredforEveryCustom.answerIds];

        const auditorAssignedQuestion = await this.dashboardDaoService.getQuestionAuditedIdsWithAnswer(Number(financialYearId), totalAnsweredForThisPeriods);
        const periodsCheckData = tmpanswered.filter(element => questionIds.has(element));

        for (let user of getUsers) {
            const sourceIds = JSON.parse(user.source_ids)
            for (let sourceId of sourceIds) {
                const tmpserAssignedQuestion = await this.dashboardDaoService.getQuestionAssignedIds(user.id, Number(financialYearId));
                const userAssignedQuestion = tmpserAssignedQuestion.flatMap(id => {
                    if (!questionIds.has(id)) return [];
                    if (filteredQuestionIdsForCUSTOM.includes(id)) {
                        return Array(Number(array.length)).fill(id);
                    }
                    return [id];
                });

                const finalAssgnedQuestion = userAssignedQuestion;

                const locationName = sourceIdName.find((item) => item.id === sourceId);
                const allSubLocations = subLocations.filter((item) => item.locationId === sourceId);

                // ✅ if location has sublocations, handle each separately
                const locationsToProcess = allSubLocations.length
                    ? allSubLocations.map((sub) => ({
                        sourceId,
                        subLocationId: sub.id,
                        unitCode: `${locationName?.unitCode} - ${sub.subLocation}`,
                        }))
                    : [
                        {
                            sourceId,
                            subLocationId: null,
                            unitCode: locationName?.unitCode,
                        },
                        ];

                for (const loc of locationsToProcess) {
                    const tmpAnswered = finalAssgnedQuestion.length ? await this.dashboardDaoService.answeredReportingIds(finalAssgnedQuestion, Number(financialYearId), totalAnsweredForThisPeriods, [loc.sourceId], loc.subLocationId) : [];
                    const tmpAnsweredIds = await this.dashboardDaoService.answeredReportingAnsweredIds(Number(financialYearId), totalAnsweredForThisPeriods, [loc.sourceId], loc.subLocationId);
                    const answered = tmpAnswered.filter(element => periodsCheckData.includes(element) && finalAssgnedQuestion.includes(element));

                    const tmpAuditerIds = auditorAssignedQuestion.filter(item => item.auditerId == user.id || (item.remark && item.remark.some(remark => remark.id == user.id)));
                    const auditerIds = tmpAuditerIds.filter(item => tmpAnsweredIds.includes(item.answerId)).map(item => item.questionId);

                    const mulptipleAuditor = auditorAssignedQuestion.filter(item => item.auditerId == user.id && (item.remark && item.remark.some(remark => remark.id == user.id))).map(item => item.questionId);
                    const tmpAuditorAnswer = auditerIds.filter(element => questionIds.has(element));
                    const finalAuditorQuestion = tmpAuditorAnswer.filter(element => periodsCheckData.includes(element));

                    const accepted = auditorAssignedQuestion.filter(item => (item.remark && item.remark.some(remark => remark.id == user.id && remark.status === 'ACCEPTED'))).map(item => item.questionId);
                    const tmpAccepted = accepted.filter(element => finalAuditorQuestion.includes(element));
                    const finalAccepted = tmpAccepted.filter(element => periodsCheckData.includes(element));

                    const rejected = auditorAssignedQuestion.filter(item => (item.remark && item.remark.some(remark => remark.id == user.id && remark.status === 'REJECTED'))).map(item => item.questionId);
                    const tmpRejected = rejected.filter(element => finalAuditorQuestion.includes(element));
                    const finalRejected = tmpRejected.filter(element => periodsCheckData.includes(element));

                    const assignQuesionAccpted = auditorAssignedQuestion.filter(item => { const lastRemark = item.remark?.[item.remark.length - 1]; return lastRemark && lastRemark.status === 'ACCEPTED'; }).map(item => item.questionId);
                    const tmpAssignQuesionAccpted = assignQuesionAccpted.filter(element => finalAssgnedQuestion.includes(element));
                    const finalAssignQuesionAccpted = tmpAssignQuesionAccpted.filter(element => answered.includes(element));

                    const assignQuesionRejected = auditorAssignedQuestion.filter(item => { const lastRemark = item.remark?.[item.remark.length - 1]; return lastRemark && lastRemark.status === 'REJECTED'; }).map(item => item.questionId);
                    const tmpAssignQuesionRejected = assignQuesionRejected.filter(element => finalAssgnedQuestion.includes(element));
                    const finalAssignQuesionRejected = tmpAssignQuesionRejected.filter(element => answered.includes(element));

                    const totalQuestions = finalAssgnedQuestion.length + finalAuditorQuestion.length;
                    const percentageAccepted = finalAuditorQuestion.length > 0 ? (finalAccepted.length === finalAuditorQuestion.length ? 100 : (finalAccepted.length / finalAuditorQuestion.length) * 100).toFixed(2) : '0.00';
                    const percentageRejected = finalAuditorQuestion.length > 0 ? (finalRejected.length === finalAuditorQuestion.length ? 100 : (finalRejected.length / finalAuditorQuestion.length) * 100).toFixed(2) : '0.00';
                    const percentageAnswered = finalAssgnedQuestion.length > 0 ? (answered.length === finalAssgnedQuestion.length ? 100 : (answered.length / finalAssgnedQuestion.length) * 100).toFixed(2) : '0.00';
                    const percentageUnresponded = totalQuestions > 0 ? (100 - (parseFloat(percentageAccepted) + parseFloat(percentageRejected) + parseFloat(percentageAnswered))).toFixed(2) : '0.00';
                    const percentageAnsweredUnresponded = finalAssgnedQuestion.length > 0 ? (100 - parseFloat(percentageAnswered)).toFixed(2) : '0.00';
                    const percentageAuditorUnresponded = finalAuditorQuestion.length > 0 ? (100 - (parseFloat(percentageAccepted) + parseFloat(percentageRejected))).toFixed(2) : '0.00';
                    const filteredRejected = finalRejected.filter(
                        id => !finalAccepted.includes(id)
                    );

                    const response = {
                        firstName: user.first_name,
                        lastName: user.last_name,
                        userId: user.id,
                        email: user.email,
                        unitCode: loc.unitCode,
                        sourceId: sourceId,
                        totalQuestions,
                        totalCompanyQuestions: filteredQuestionIdsForCUSTOM.length + filteredQuestionIdsForEveryFY.length,
                        acceptedQuestionIds: finalAccepted,
                        answeredQuestionIds: answered,
                        rejectedQuestionIds: finalRejected,
                        finalAssignQuesionAccptedIds: finalAssignQuesionAccpted,
                        finalAssignQuesionRejectedIds: finalAssignQuesionRejected,
                        finalAssignQuesionAccpted: finalAssignQuesionAccpted.length,
                        finalAssignQuesionRejected: finalAssignQuesionRejected.length,
                        accepted: finalAccepted.length,
                        answered: answered.length,
                        rejected: finalRejected.length,
                        totalAssignedQuestionForAnswered: finalAssgnedQuestion.length,
                        totalAssignedQuestionForAudit: finalAuditorQuestion.length,
                        notResponded: totalQuestions - (Number(finalAccepted.length) + Number(answered.length) + Number(filteredRejected.length)),
                        answerNotResponded: finalAssgnedQuestion.length - Number(answered.length),
                        auditorNotResponded: finalAuditorQuestion.length - (Number(finalAccepted.length) + Number(filteredRejected.length)),
                        answerNotRespondedIds: finalAssgnedQuestion.filter((id) => !answered.includes(id)),
                        auditorNotRespondedIds: [...finalAuditorQuestion.filter((id) => !finalAccepted.includes(id) && !rejected.includes(id)), ...mulptipleAuditor],
                        questionIds: [...finalAssgnedQuestion, ...finalAuditorQuestion],
                        finalAssgnedQuestionIds: finalAssgnedQuestion,
                        percentageAccepted,
                        percentageRejected,
                        percentageAnswered,
                        percentageUnresponded,
                        percentageAnsweredUnresponded,
                        percentageAuditorUnresponded
                    };
                    teamWorkloadResults.push(response);
                }
            }
        }

        return teamWorkloadResults;
    }

    async teamWorkloadProgesForEachPeriods(financialYearId: number, financialYearValue: string, systemUserId: number, periods: any, sourceIds: any) {
        const fromDates = periods.map(p => p.fromDate);
        const array: string[] = fromDates;
        const userOrgChart = await this.findUserOrgChartData(systemUserId);

        const getCompany = await this.userDaoService.getHeadOfficeCompanyDetails(true);
        const frameworkIds = await this.getFrameworkIds(getCompany.company_id);

        const userIds = await this.extractUserIds(userOrgChart);
        const getUser = await this.userDaoService.getTeamUser(userIds);

        const getUsers = getUser.filter(obj => {
            const sourceIds = JSON.parse(obj.source_ids || "[]").map(Number);
            return sourceIds.some(id => (sourceIds).includes(id));
        });

        const queryParam = {
            company_id: getCompany.company_id,
            user_type_code: 'COMPANY',
            framework_ids: frameworkIds,
            qIds: undefined,
        };

        const getSectorQuestionResponse = await this.externalApiCallService.getReq(
            process.env.COMPANY_SERVER_API_URL + 'getReportingQuestion', queryParam, {},
        );

        const getSectorQuestion = getSectorQuestionResponse["data"];

        const questionIds = 
            new Set(
                getSectorQuestion
                    .filter(details => (details.questionId && !details.isFormulaBased))
                    .map(details => details.questionId)
            );

        const teamWorkloadResults = [];

        const filteredQuestionIdsForCUSTOM = [];
        const filteredQuestionIdsForEveryFY = [];
        getSectorQuestion.forEach(item => {
            if (!questionIds.has(item.questionId)) return;

            if (item.frequency === "CUSTOM") {
                for (let i = 0; i < array.length; i++) {
                    filteredQuestionIdsForCUSTOM.push(item.questionId);
                }
            } else {
                filteredQuestionIdsForEveryFY.push(item.questionId);
            }
        });

        // Get all answered data once for efficiency
        const tmpansweredforEveryFY = await this.dashboardDaoService.answeredReportingAllIdsDataForEveryFY(Number(financialYearId), sourceIds, filteredQuestionIdsForEveryFY);
        const tmpansweredforEveryCustom = await this.dashboardDaoService.answeredReportingAllIdsDataForCustom(Number(financialYearId), array, sourceIds, filteredQuestionIdsForCUSTOM);
        const tmpanswered = [...tmpansweredforEveryFY.questionIds, ...tmpansweredforEveryCustom.questionIds];

        const totalAnsweredForThisPeriods = [...tmpansweredforEveryFY.answerIds, ...tmpansweredforEveryCustom.answerIds];

        const auditorAssignedQuestion = await this.dashboardDaoService.getQuestionAuditedIdsWithAnswer(Number(financialYearId), totalAnsweredForThisPeriods);
        const periodsCheckData = tmpanswered.filter(element => questionIds.has(element));

        // Loop through each user
        for (let user of getUsers) {
            const tmpserAssignedQuestions = await this.dashboardDaoService.getQuestionAssignedIds(user.id, Number(financialYearId));
            const tmpserAssignedQuestion = tmpserAssignedQuestions.filter(element => questionIds.has(element));

            // Loop through each period for this user
            for (let i = 0; i < periods.length; i++) {
                const currentPeriod = periods[i];
                const currentFromDate = currentPeriod.fromDate;

                // Calculate user assigned questions for this specific period
                const userAssignedQuestionForPeriod = tmpserAssignedQuestion.flatMap(id => {
                    if (filteredQuestionIdsForEveryFY.includes(id)) {
                        return [id]; // EVERY_FY questions appear once per period
                    }
                    if (filteredQuestionIdsForCUSTOM.includes(id)) {
                        return [id]; // CUSTOM questions for this period only
                    }
                    return [];
                });

                const sourceId = JSON.parse(user.source_ids);

                const tmpansweredforEveryFY = await this.dashboardDaoService.answeredReportingAllIdsDataForEveryFY(Number(financialYearId), sourceIds, filteredQuestionIdsForEveryFY);
                const tmpansweredforEveryCustom = await this.dashboardDaoService.answeredReportingAllIdsDataForCustom(Number(financialYearId), [currentPeriod.fromDate], sourceIds, filteredQuestionIdsForCUSTOM);


                const totalAnsweredForThisPeriods = [...tmpansweredforEveryFY.answerIds, ...tmpansweredforEveryCustom.answerIds];

                const auditorAssignedQuestion = await this.dashboardDaoService.getQuestionAuditedIdsWithAnswer(Number(financialYearId), totalAnsweredForThisPeriods);
                

                const auditerIds = auditorAssignedQuestion.filter(item =>
                    item.auditerId == user.id || (item.remark && item.remark.some(remark => remark.id == user.id))
                ).map(item => item.questionId);

                const mulptipleAuditor = auditorAssignedQuestion.filter(item =>
                    item.auditerId == user.id && (item.remark && item.remark.some(remark => remark.id == user.id))
                ).map(item => item.questionId);

                const finalAssgnedQuestion = userAssignedQuestionForPeriod.filter(element => questionIds.has(element));
                const tmpAuditorAnswer = auditerIds.filter(element => questionIds.has(element));

                // Filter data for this specific period
                const periodsCheckDataForThisPeriod = periodsCheckData.filter(questionId => {
                    if (filteredQuestionIdsForEveryFY.includes(questionId)) {
                        return true; // EVERY_FY applies to all periods
                    }
                    // For CUSTOM frequency, you might need additional logic here to filter by period
                    // This depends on your data structure and how periods are associated with questions
                    return periodsCheckData.includes(questionId);
                });

                const finalAuditorQuestion = tmpAuditorAnswer.filter(element => periodsCheckDataForThisPeriod.includes(element));

            
                const tmpAnswered = finalAssgnedQuestion.length ?
                    await this.dashboardDaoService.answeredReportingIds(finalAssgnedQuestion, Number(financialYearId), totalAnsweredForThisPeriods, sourceId, null) : [];
                const answered = tmpAnswered.filter(element => periodsCheckDataForThisPeriod.includes(element) && finalAssgnedQuestion.includes(element));

                const accepted = auditorAssignedQuestion.filter(item =>
                    (item.remark && item.remark.some(remark => remark.id == user.id && remark.status === 'ACCEPTED'))
                ).map(item => item.questionId);

                const tmpAccepted = accepted.filter(element => finalAuditorQuestion.includes(element));
                const finalAccepted = tmpAccepted.filter(element => periodsCheckDataForThisPeriod.includes(element));

                const rejected = auditorAssignedQuestion.filter(item =>
                    (item.remark && item.remark.some(remark => remark.id == user.id && remark.status === 'REJECTED'))
                ).map(item => item.questionId);
                const tmpRejected = rejected.filter(element => finalAuditorQuestion.includes(element));
                const finalRejected = tmpRejected.filter(element => periodsCheckDataForThisPeriod.includes(element));

                const assignQuesionAccpted = auditorAssignedQuestion.filter(item => {
                    const lastRemark = item.remark?.[item.remark.length - 1];
                    return lastRemark && lastRemark.status === 'ACCEPTED';
                }).map(item => item.questionId);
                const tmpAssignQuesionAccpted = assignQuesionAccpted.filter(element => finalAssgnedQuestion.includes(element));
                const finalAssignQuesionAccpted = tmpAssignQuesionAccpted.filter(element => answered.includes(element));

                const assignQuesionRejected = auditorAssignedQuestion.filter(item => {
                    const lastRemark = item.remark?.[item.remark.length - 1];
                    return lastRemark && lastRemark.status === 'REJECTED';
                }).map(item => item.questionId);
                const tmpAssignQuesionRejected = assignQuesionRejected.filter(element => finalAssgnedQuestion.includes(element));
                const finalAssignQuesionRejected = tmpAssignQuesionRejected.filter(element => answered.includes(element));

                // Calculate metrics for this specific period
                const totalQuestions = finalAssgnedQuestion.length + finalAuditorQuestion.length;
                const percentageAccepted = finalAuditorQuestion.length > 0 ?
                    (finalAccepted.length === finalAuditorQuestion.length ? 100 : (finalAccepted.length / finalAuditorQuestion.length) * 100).toFixed(2) : '0.00';
                const percentageRejected = finalAuditorQuestion.length > 0 ?
                    (finalRejected.length === finalAuditorQuestion.length ? 100 : (finalRejected.length / finalAuditorQuestion.length) * 100).toFixed(2) : '0.00';
                const percentageAnswered = finalAssgnedQuestion.length > 0 ?
                    (answered.length === finalAssgnedQuestion.length ? 100 : (answered.length / finalAssgnedQuestion.length) * 100).toFixed(2) : '0.00';
                const percentageUnresponded = totalQuestions > 0 ?
                    (100 - (parseFloat(percentageAccepted) + parseFloat(percentageRejected) + parseFloat(percentageAnswered))).toFixed(2) : '0.00';
                const percentageAnsweredUnresponded = finalAssgnedQuestion.length > 0 ?
                    (100 - parseFloat(percentageAnswered)).toFixed(2) : '0.00';
                const percentageAuditorUnresponded = finalAuditorQuestion.length > 0 ?
                    (100 - (parseFloat(percentageAccepted) + parseFloat(percentageRejected))).toFixed(2) : '0.00';

                const filteredRejected = finalRejected.filter(id => !finalAccepted.includes(id));

                const response = {
                    firstName: user.first_name,
                    lastName: user.last_name,
                    userId: user.id,
                    email: user.email,
                    fromDate: currentFromDate, // Added fromDate for period identification
                    period: currentPeriod, // Added full period object
                    totalQuestions,
                    totalCompanyQuestions: filteredQuestionIdsForCUSTOM.length + filteredQuestionIdsForEveryFY.length,
                    acceptedQuestionIds: finalAccepted,
                    answeredQuestionIds: answered,
                    rejectedQuestionIds: finalRejected,
                    finalAssignQuesionAccptedIds: finalAssignQuesionAccpted,
                    finalAssignQuesionRejectedIds: finalAssignQuesionRejected,
                    finalAssignQuesionAccpted: finalAssignQuesionAccpted.length,
                    finalAssignQuesionRejected: finalAssignQuesionRejected.length,
                    accepted: finalAccepted.length,
                    answered: answered.length,
                    rejected: finalRejected.length,
                    totalAssignedQuestionForAnswered: finalAssgnedQuestion.length,
                    totalAssignedQuestionForAudit: finalAuditorQuestion.length,
                    notResponded: totalQuestions - (Number(finalAccepted.length) + Number(answered.length) + Number(filteredRejected.length)),
                    answerNotResponded: finalAssgnedQuestion.length - Number(answered.length),
                    auditorNotResponded: finalAuditorQuestion.length - (Number(finalAccepted.length) + Number(filteredRejected.length)),
                    answerNotRespondedIds: finalAssgnedQuestion.filter((id) => !answered.includes(id)),
                    auditorNotRespondedIds: [...finalAuditorQuestion.filter((id) => !finalAccepted.includes(id) && !rejected.includes(id)), ...mulptipleAuditor],
                    questionIds: [...finalAssgnedQuestion, ...finalAuditorQuestion],
                    finalAssgnedQuestionIds: finalAssgnedQuestion,
                    percentageAccepted,
                    percentageRejected,
                    percentageAnswered,
                    percentageUnresponded,
                    percentageAnsweredUnresponded,
                    percentageAuditorUnresponded
                };

                teamWorkloadResults.push(response);
            }
        }

        return teamWorkloadResults;
    }

    async teamWorkloadProgessForSinglePeriods(financialYearId: number, financialYearValue: string, systemUserId: number, periods: any, sourceIds: any, sourceIdName: any, subLocations: any) {
        const fromDates = periods.map(p => p.fromDate);
        const periodsValues: string[] = fromDates;
        const array = [periodsValues[periodsValues.length - 1]];
        const userOrgChart = await this.findUserOrgChartData(systemUserId);
        const getCompany = await this.userDaoService.getHeadOfficeCompanyDetails(true);
        const frameworkIds = await this.getFrameworkIds(getCompany.company_id);

        const userIds = await this.extractUserIds(userOrgChart);
        const getUser = await this.userDaoService.getTeamUser(userIds);

        const getUsers = getUser.filter(obj => {
            const sourceIds = JSON.parse(obj.source_ids || "[]").map(Number);
            return sourceIds.some(id => (sourceIds).includes(id));
        });

        const queryParam = {
            company_id: getCompany.company_id,
            user_type_code: 'COMPANY',
            framework_ids: frameworkIds,
            qIds: undefined,
        };

        const getSectorQuestionResponse = await this.externalApiCallService.getReq(
            process.env.COMPANY_SERVER_API_URL + 'getReportingQuestion', queryParam, {},
        );


        const getSectorQuestion = getSectorQuestionResponse["data"];

        const questionIds = 
            new Set(
                getSectorQuestion
                    .filter(details => (details.questionId && !details.isFormulaBased))
                    .map(details => details.questionId)
            );

        const teamWorkloadResults = [];

        const filteredQuestionIdsForCUSTOM = [];
        const filteredQuestionIdsForEveryFY = [];
        getSectorQuestion.forEach(item => {
            if (!questionIds.has(item.questionId)) return;

            if (item.frequency === "CUSTOM") {
                for (let i = 0; i < array.length; i++) {
                    filteredQuestionIdsForCUSTOM.push(item.questionId);
                }
            } else {
                filteredQuestionIdsForEveryFY.push(item.questionId);
            }
        });

        const tmpansweredforEveryFY = await this.dashboardDaoService.answeredReportingAllIdsDataForEveryFY(Number(financialYearId), sourceIds, filteredQuestionIdsForEveryFY);
        const tmpansweredforEveryCustom = await this.dashboardDaoService.answeredReportingAllIdsDataForCustom(Number(financialYearId), array, sourceIds, filteredQuestionIdsForCUSTOM);
        const tmpanswered = [...tmpansweredforEveryFY.questionIds, ...tmpansweredforEveryCustom.questionIds];

        const totalAnsweredForThisPeriods = [...tmpansweredforEveryFY.answerIds, ...tmpansweredforEveryCustom.answerIds];

        const auditorAssignedQuestion = await this.dashboardDaoService.getQuestionAuditedIdsWithAnswer(Number(financialYearId), totalAnsweredForThisPeriods);
        const periodsCheckData = tmpanswered.filter(element => questionIds.has(element));

        for (let user of getUsers) {
            const sourceIds = JSON.parse(user.source_ids);

            for (let sourceId of sourceIds) {
                const tmpserAssignedQuestion = await this.dashboardDaoService.getQuestionAssignedIds(user.id, Number(financialYearId));

                const userAssignedQuestion = tmpserAssignedQuestion.flatMap((id) => {
                    if (!questionIds.has(id)) return [];

                    if (filteredQuestionIdsForCUSTOM.includes(id)) {
                        return Array(Number(array.length)).fill(id);
                    }
                    return [id];
                });

                const locationName = sourceIdName.find((item) => item.id === sourceId);
                const allSubLocations = subLocations.filter((item) => item.locationId === sourceId);

                // ✅ if location has sublocations, handle each separately
                const locationsToProcess = allSubLocations.length
                    ? allSubLocations.map((sub) => ({
                        sourceId,
                        subLocationId: sub.id,
                        unitCode: `${locationName?.unitCode} - ${sub.subLocation}`,
                        }))
                    : [
                        {
                            sourceId,
                            subLocationId: null,
                            unitCode: locationName?.unitCode,
                        },
                        ];

                locationsToProcess.sort((a, b) =>
                    a.unitCode.localeCompare(b.unitCode, undefined, { sensitivity: "base" })
                );

                for (const loc of locationsToProcess) {
                    const finalAssgnedQuestion = userAssignedQuestion;

                    const tmpAnswered = finalAssgnedQuestion.length ? await this.dashboardDaoService.answeredReportingIds(finalAssgnedQuestion, Number(financialYearId), totalAnsweredForThisPeriods, [loc.sourceId], loc.subLocationId) : [];

                    const tmpAnsweredIds = await this.dashboardDaoService.answeredReportingAnsweredIds(Number(financialYearId), totalAnsweredForThisPeriods, [loc.sourceId], loc.subLocationId);

                    const answered = tmpAnswered.filter((element) => periodsCheckData.includes(element) && finalAssgnedQuestion.includes(element));

                    const tmpAuditerIds = auditorAssignedQuestion.filter((item) => item.auditerId == user.id || (item.remark && item.remark.some((remark) => remark.id == user.id)));
                    const auditerIds = tmpAuditerIds
                        .filter((item) => tmpAnsweredIds.includes(item.answerId))
                        .map((item) => item.questionId);

                    const mulptipleAuditor = auditorAssignedQuestion
                        .filter((item) => item.auditerId == user.id && item.remark && item.remark.some((remark) => remark.id == user.id))
                        .map((item) => item.questionId);

                    const tmpAuditorAnswer = auditerIds.filter((element) => questionIds.has(element));
                    const finalAuditorQuestion = tmpAuditorAnswer.filter((element) => periodsCheckData.includes(element));

                    const accepted = auditorAssignedQuestion
                        .filter((item) => item.remark && item.remark.some((remark) => remark.id == user.id && remark.status === "ACCEPTED"))
                        .map((item) => item.questionId);
                    const tmpAccepted = accepted.filter((element) => finalAuditorQuestion.includes(element));
                    const finalAccepted = tmpAccepted.filter((element) => periodsCheckData.includes(element));

                    const rejected = auditorAssignedQuestion
                        .filter((item) => item.remark && item.remark.some((remark) => remark.id == user.id && remark.status === "REJECTED"))
                        .map((item) => item.questionId);
                    const tmpRejected = rejected.filter((element) => finalAuditorQuestion.includes(element));
                    const finalRejected = tmpRejected.filter((element) => periodsCheckData.includes(element));

                    const assignQuesionAccpted = auditorAssignedQuestion
                        .filter((item) => {
                            const lastRemark = item.remark?.[item.remark.length - 1];
                            return lastRemark && lastRemark.status === "ACCEPTED";
                        })
                        .map((item) => item.questionId);
                    const tmpAssignQuesionAccpted = assignQuesionAccpted.filter((element) => finalAssgnedQuestion.includes(element));
                    const finalAssignQuesionAccpted = tmpAssignQuesionAccpted.filter((element) => answered.includes(element));

                    const assignQuesionRejected = auditorAssignedQuestion
                        .filter((item) => {
                            const lastRemark = item.remark?.[item.remark.length - 1];
                            return lastRemark && lastRemark.status === "REJECTED";
                        })
                        .map((item) => item.questionId);
                    const tmpAssignQuesionRejected = assignQuesionRejected.filter((element) => finalAssgnedQuestion.includes(element));
                    const finalAssignQuesionRejected = tmpAssignQuesionRejected.filter((element) => answered.includes(element));

                    const totalQuestions = finalAssgnedQuestion.length + finalAuditorQuestion.length;
                    const percentageAccepted = finalAuditorQuestion.length > 0 ? ((finalAccepted.length / finalAuditorQuestion.length) * 100).toFixed(2) : "0.00";
                    const percentageRejected = finalAuditorQuestion.length > 0 ? ((finalRejected.length / finalAuditorQuestion.length) * 100).toFixed(2) : "0.00";
                    const percentageAnswered = finalAssgnedQuestion.length > 0 ? ((answered.length / finalAssgnedQuestion.length) * 100).toFixed(2) : "0.00";
                    const percentageUnresponded = totalQuestions > 0 ? (100 - (parseFloat(percentageAccepted) + parseFloat(percentageRejected) + parseFloat(percentageAnswered))).toFixed(2) : "0.00";

                    const filteredRejected = finalRejected.filter((id) => !finalAccepted.includes(id));

                    const response = {
                        firstName: user.first_name,
                        lastName: user.last_name,
                        userId: user.id,
                        email: user.email,
                        unitCode: loc.unitCode,
                        sourceId: loc.sourceId,
                        subLocationId: loc.subLocationId, // ✅ added
                        totalQuestions,
                        totalCompanyQuestions: filteredQuestionIdsForCUSTOM.length + filteredQuestionIdsForEveryFY.length,
                        acceptedQuestionIds: finalAccepted,
                        answeredQuestionIds: answered,
                        rejectedQuestionIds: finalRejected,
                        finalAssignQuesionAccptedIds: finalAssignQuesionAccpted,
                        finalAssignQuesionRejectedIds: finalAssignQuesionRejected,
                        finalAssignQuesionAccpted: finalAssignQuesionAccpted.length,
                        finalAssignQuesionRejected: finalAssignQuesionRejected.length,
                        accepted: finalAccepted.length,
                        answered: answered.length,
                        rejected: finalRejected.length,
                        totalAssignedQuestionForAnswered: finalAssgnedQuestion.length,
                        totalAssignedQuestionForAudit: finalAuditorQuestion.length,
                        notResponded: totalQuestions - (Number(finalAccepted.length) + Number(answered.length) + Number(filteredRejected.length)),
                        answerNotResponded: finalAssgnedQuestion.length - Number(answered.length),
                        auditorNotResponded: finalAuditorQuestion.length - (Number(finalAccepted.length) + Number(filteredRejected.length)),
                        answerNotRespondedIds: finalAssgnedQuestion.filter((id) => !answered.includes(id)),
                        auditorNotRespondedIds: [...finalAuditorQuestion.filter((id) => !finalAccepted.includes(id) && !rejected.includes(id)), ...mulptipleAuditor],
                        questionIds: [...finalAssgnedQuestion, ...finalAuditorQuestion],
                        finalAssgnedQuestionIds: finalAssgnedQuestion,
                        percentageAccepted,
                        percentageRejected,
                        percentageAnswered,
                        percentageUnresponded,
                    };

                    teamWorkloadResults.push(response);
                }
            }
        }

        return teamWorkloadResults;
    }

    private getReportingPeriodString(periodRecord) {
        if (!periodRecord?.fromDate || !periodRecord?.toDate) return "";

        const fromDate = new Date(`${periodRecord.fromDate}-01`);
        const toDate = new Date(`${periodRecord.toDate}-01`);

        // Make toDate inclusive by subtracting one month
        toDate.setMonth(toDate.getMonth() - 1);

        const fromStr = fromDate.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
        });
        const toStr = toDate.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
        });

        // If same month & year, use only one
        return fromStr === toStr ? fromStr : `${fromStr} - ${toStr}`;
    };

    private async getFrameworkIds(companyId: number): Promise<number[]> {
        const response = await this.externalApiCallService.getReq(
            process.env.COMPANY_SERVER_API_URL + 'getFramework',
            { companyId: companyId, type: 'ALL', user_type_code: 'company' },
            {},
        );
        return response.data.map((obj: any) => obj.id);
    }

    private async findUserOrgChartData(targetUserId: number) {
        const systemUserId = targetUserId;
        const { id: headOffice } = await this.userDaoService.getCompanyDetailsBasedOnParentIdNull();
        const getHeadOrgDetails = await this.orgChartDaoService.getOrgChartUserId(headOffice);
        const userOrgChart = await this.findUserOrgChart(JSON.parse(getHeadOrgDetails.orgChart), Number(systemUserId));
        return userOrgChart;
    }

    private async findUserOrgChart(orgData: OrgData, targetUserId: number): Promise<OrgData | null> {
        if (Number(orgData.userId) === targetUserId) return orgData;
        for (const child of orgData.children || []) {
            const result = await this.findUserOrgChart(child, targetUserId);
            if (result) return result;
        }
        return null;
    }

    private async extractUserIds(orgData: OrgData): Promise<number[]> {
        let userIds: number[] = [];

        function traverse(node: OrgData) {
            if (typeof node.userId === 'number') {
                userIds.push(node.userId);
            }
            if (node.children && node.children.length > 0) {
                node.children.forEach(child => traverse(child));
            }
        }

        traverse(orgData);
        return userIds;
    }

    private generatePeriods(
        frequency: any,
        startingMonth: number,      // 1..12
        yearRange: string           // "2024-2025"
    ): PeriodRow[] {
        const [startYear] = yearRange.split('-').map(Number);
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        // EXACT same arithmetic as your frontend calculateDateRange()
        const calc = (type: number, period: number, start: number, year: number, frequency: string) => {
            const startMonth = ((start - 1 + (period - 1) * type) % 12) + 1;
            const startY = year + Math.floor((start - 1 + (period - 1) * type) / 12);
            const endMonth = ((startMonth - 1 + type) % 12) + 1;
            const rawCalEndMonth = frequency === 'QUARTERLY' ? ((startMonth - 1 + type) % 12) :
                frequency === 'HALF_YEARLY' ? ((startMonth - 1 + type) % 12) + 3 : frequency === 'YEARLY' ? ((startMonth - 1 + type) % 12) + 9 : ((startMonth - 1 + type) % 12);
            const endY = startY + Math.floor((startMonth - 1 + type) / 12);
            const mm = (n: number) => (n < 10 ? `0${n}` : `${n}`);
            const normalizeMonth = (m: number) => {
                if (m <= 0) return 12;            // turn 0 or negative into December
                if (m > 12) return m % 12 || 12;  // keep within 1..12
                return m;
            };
            const calEndMonth = normalizeMonth(rawCalEndMonth);  // 👈 normalize before using


            // calculate last day of endMonth
            const lastDay = new Date(endY, calEndMonth, 0).getDate();

            return {
                fromDate: `${startY}-${mm(startMonth)}`,       // inclusive
                toDate: `${endY}-${mm(endMonth)}`,             // exclusive (YYYY-MM only)
                calToDate: `${endY}-${mm(calEndMonth)}-${mm(lastDay)}`, // full date
                startMonthIdx: startMonth - 1                  // 0..11
            };
        };



        const out: PeriodRow[] = [];

        if (frequency === 'MONTHLY') {
            for (let p = 1; p <= 12; p++) {
                const r = calc(1, p, startingMonth, startYear, frequency);
                out.push({
                    fromDate: r.fromDate,
                    toDate: r.toDate,
                    calToDate: r.calToDate,
                    displayName: months[r.startMonthIdx],
                });
            }
        } else if (frequency === 'QUARTERLY') {
            for (let p = 1; p <= 4; p++) {
                const r = calc(3, p, startingMonth, startYear, frequency);
                const endIdx = (r.startMonthIdx + 2) % 12;
                out.push({
                    fromDate: r.fromDate,
                    toDate: r.toDate,
                    calToDate: r.calToDate,
                    displayName: `${months[r.startMonthIdx]} - ${months[endIdx]}`,
                });
            }
        } else if (frequency === 'HALF_YEARLY') {
            for (let p = 1; p <= 2; p++) {
                const r = calc(6, p, startingMonth, startYear, frequency);
                const endIdx = (r.startMonthIdx + 5) % 12;
                out.push({
                    fromDate: r.fromDate,
                    toDate: r.toDate,
                    calToDate: r.calToDate,
                    displayName: `${months[r.startMonthIdx]} - ${months[endIdx]}`,
                });
            }
        } else if (frequency === 'YEARLY') {
            const r = calc(12, 1, startingMonth, startYear, frequency);
            const endIdx = (r.startMonthIdx + 11) % 12;
            out.push({
                fromDate: r.fromDate,
                toDate: r.toDate,
                calToDate: r.calToDate,
                displayName: `${months[r.startMonthIdx]} - ${months[endIdx]}`,
            });
        }

        return out;
    }

    private getFinancialYearRange(finYear: string, startMonthIdx: number) {
        const [startY, endY] = finYear.split("-").map(y => Number(y));
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        const startMonth = startMonthIdx + 1;                // convert 0..11 → 1..12
        const endMonth = ((startMonth + 11) % 12) || 12;     // 12 months later
        const tmpendMonth = ((startMonth + 11) % 12) || 12;

        // helper to pad month number
        function mm(month: number): string {
            return month.toString().padStart(2, "0");
        }

        const lastDay = new Date(endY, tmpendMonth, 0).getDate();

        return {
            fromDate: `${startY}-${mm(startMonth)}`, // inclusive
            toDate: `${endY}-${mm(endMonth)}`,       // exclusive
            displayName: `${months[startMonthIdx]} - ${months[endMonth - 1]}`,
            calEndMonth: `${endY}-${mm(tmpendMonth)}-${mm(lastDay)}`
        };
    }

    private formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
        });
    };
}