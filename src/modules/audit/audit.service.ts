import { AuditListingDaoService } from '@modules/dao/audit/audit-listing-dao/audit-listing-dao.service';
import { SectorQuestionDaoModuleService } from '@modules/dao/sector-question-dao-module/sector-question-dao-module.service';
import { UserDaoService } from '@modules/dao/setting/user-dao/user-dao.service';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ExternalApiCallService } from '@utils/common/external-api-call/external-api-call.service';
import { AssignQuestionToAuditorDto } from './dto/assign-auditor.dto';
import { ValidateAnswerDto } from './dto/validate-answer.dto';
import { AuditHistoryEntity } from './entities/audit_history.entity';
import { QuestionStatus } from '@utils/enums/Status';
import { AuditHistoryDaoService } from '@modules/dao/audit/audit-history-dao/audit-history-dao.service';
import { ReportingModuleDaoService } from '@modules/dao/reporting-module-dao/reporting-module-dao.service';
import { AnswerFrequencyDaoService } from '@modules/dao/setting/answer-frequency-dao/answer-frequency-dao.service';
import { OrgChartDaoService } from '@modules/dao/setting/org-chart-dao/org-chart-dao.service';
import { UserActivityLog } from '@modules/setting/user/entities/user_activity_logs';
import { TodaysActivity } from '@modules/dashboard/entities/today_activity.entity';
import { DashboardDaoService } from '@modules/dao/dashboard-dao/dashboard-dao.service';
import { SubUserDaoService } from '../dao/setting/sub-user-dao/sub-user-dao.service';

interface OrgData {
    userId: string;
    orgChart?: any;
    children?: OrgData[];
}
@Injectable()
export class AuditService {
    constructor(private externalApiCallService: ExternalApiCallService, private userDaoService: UserDaoService, private subUserDaoService: SubUserDaoService, private auditHistoryDaoService: AuditHistoryDaoService, private answerFrequencyDaoService: AnswerFrequencyDaoService,
        private sectorQuestionDaoModuleService: SectorQuestionDaoModuleService, private auditListingDaoService: AuditListingDaoService, private reportingModuleDaoService: ReportingModuleDaoService, private orgChartDaoService: OrgChartDaoService, private dashboardDaoService: DashboardDaoService
    ) { }

    async getAuditListing(req: any) {
        const systemUserId = req.headers.userid;
        const getCompany = await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId);
        const { muduleType, questionType, financialYearId } = req.query;
        const userOrgChart = await this.findUserOrgChartData(systemUserId);
        if (!userOrgChart) {
          throw new HttpException({ status: 200, message: 'No Data Found', data: { teamWorkloadResults: [] } }, HttpStatus.OK);
        }
    
        const userIds = await this.extractUserIds(userOrgChart);

        const frameworkIds = (await this.externalApiCallService.getReq(
            process.env.COMPANY_SERVER_API_URL + 'getFramework',
            { companyId: getCompany.company_id, type: 'ALL', user_type_code: 'company' },
            {},
        )).data.map((obj) => obj.id)
        const auditDetails = await this.auditListingDaoService.getAuditQuestionIdsAndAuditIds(userIds, financialYearId);
        const questionIds = auditDetails.map((details) => Number(details.questionId));
        if (!questionIds.length) {
            throw new HttpException({ status: 200, message: 'Data Found', data: [], getAssignedDetails: [] }, HttpStatus.OK);
        }
        const queryParam = {
            company_id: getCompany.company_id,
            user_type_code: 'COMPANY',
            framework_ids: frameworkIds,
            qIds: [... new Set(questionIds)],
        };


        const getSectorQuestion = await this.externalApiCallService.getReq(
            process.env.COMPANY_SERVER_API_URL + 'getReportingQuestion',
            queryParam,
            {},
        );



        // const getSectorQuestion = await this.externalApiCallService.getReq(
        //     process.env.COMPANY_SERVER_API_URL + 'getSectorQuestion',
        //     queryParam,
        //     {},
        // );
        const modules = await this.answerFrequencyDaoService.getAnswerFrequency(Number(financialYearId));
        const getAssignedDetails = await this.sectorQuestionDaoModuleService.getAssignedDetails([... new Set(questionIds)], Number(financialYearId));
        const getUsers = await this.userDaoService.getUsers(true);
        for (const item of getAssignedDetails) {
            const filteredAToDetails = getUsers.filter(obj => item.assignedTo.includes(String(obj.id)));
            const filteredAssignedByDetails = getUsers.filter(obj => [item.assignedBy].includes(obj.id));
            Object.assign(item, { assignedByDetails: filteredAssignedByDetails, assignedToDetails: filteredAToDetails });
        }
        const getSubUserDetails = await this.userDaoService.getAllUsers();
        const answer = await this.reportingModuleDaoService.getReportingQuestionAnswerBasedFnancialIds(Number(financialYearId));
        const auditDetail = await this.auditListingDaoService.getAuditQuestionIdsAndAuditIds(userIds, Number(financialYearId));
        const finalAuditDetails = getSectorQuestion?.data?.map(questionObj => {
            const answerObj = answer.filter(answers => answers.questionId === questionObj.questionId);
            const matchingModule = modules.find(module => module.moduleId === questionObj.moduleId);
            console.log(matchingModule,questionObj.moduleId,modules)
            questionObj.answerFrequency = matchingModule.frequency;
            let matchingAuditors = auditDetail.filter((details) => details.questionId === questionObj.questionId);

            matchingAuditors = matchingAuditors.map(auditListing => {
                if (Array.isArray(auditListing.remark) && auditListing.remark.length > 0) {
                    const filteredRemarks = auditListing.remark.map(remark => {
                        const auditor = getSubUserDetails.find(auditor => auditor.id == remark.id);
                        return auditor ? {
                            id: auditor.id,
                            firstName: auditor.first_name,
                            lastLame: auditor.last_name,
                            email: auditor.email,
                            position: auditor.position,
                            remark: remark.remark,
                            status: remark.status,
                            auditedDate: remark.auditedDate,
                            answerId: auditListing.answerId
                        } : null;
                    }).filter(result => result !== null);

                    auditListing['remark'] = filteredRemarks;
                }
                return { ...auditListing };
            });

            matchingAuditors.forEach((auditor) => {
                const matchingAnswer = answer.find((answer) => answer.id == auditor.answerId);
                if (matchingAnswer) { auditor.fromDate = matchingAnswer?.fromDate; }
            });

            const auditorId = auditDetail.find((details) => details.questionId === questionObj.questionId);
            if (questionObj && answerObj) {
                return { answerFrequency: matchingModule.frequency, questionId: questionObj.id, title: questionObj.title, heading: questionObj.heading, questionType: questionObj.questionType, question: questionObj, answer: [], auditorId: auditorId, matchingAuditors: matchingAuditors,mapFrameworkIds:questionObj.mapFrameworkIds };
            }
            return null;
        }).filter(Boolean);
        if (getAssignedDetails.length && getSectorQuestion.data.length) {
            throw new HttpException(
                { status: 200, message: 'Data Found', data: finalAuditDetails, getAssignedDetails: getAssignedDetails },
                HttpStatus.OK,
            );
        } else {
            throw new HttpException({ status: 200, message: 'Data Found', data: [], getAssignedDetails: [] }, HttpStatus.OK);
        }
    }

    async getAuditHistoryModule(req: any) {
        const systemUserId = req.headers.userid;
        const getCompany = await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId);
        const { frameworkId, financialYearId } = req.query;

        let frameworkIds;
        if (frameworkId?.length > 0) {
            frameworkIds = JSON.parse(frameworkId);
        } else {
            const frameworkApiResponse = await this.externalApiCallService.getReq(
                process.env.COMPANY_SERVER_API_URL + 'getFramework',
                { companyId: getCompany.company_id, type: 'ALL', user_type_code: 'company' },
                {},
            );
            frameworkIds = frameworkApiResponse.data.map((obj) => obj.id);
        }

        const queryParam = {
            companyId: getCompany.company_id,
            type: "CUSTOM",
            user_type_code: 'company',
            entity: 'company',
            framework_ids: frameworkIds,
            topic_ids: req.query.topicIds || [],
            kpi_ids: req.query.kpiIds || [],
            financial_year_id: 6,
            questionnaire_type: "SQ",
            qIds: getCompany.parent_id ? await this.sectorQuestionDaoModuleService.getQuestionIds(systemUserId, 6) : undefined,
        };

        const getSectorQuestion = await this.externalApiCallService.getReq(
            process.env.COMPANY_SERVER_API_URL + 'getSectorQuestion',
            queryParam,
            {},
        );
        const getAssignedDetails = await this.sectorQuestionDaoModuleService.getAssignedDetails(getSectorQuestion?.questionIds, Number(financialYearId));
        const getUsers = await this.userDaoService.getUsers(true);
        for (const item of getAssignedDetails) {
            const filteredAToDetails = getUsers.filter(obj => item.assignedTo.includes(String(obj.id)));
            const filteredAssignedByDetails = getUsers.filter(obj => [item.assignedBy].includes(obj.id));
            Object.assign(item, { assignedByDetails: filteredAssignedByDetails, assignedToDetails: filteredAToDetails });
        }

        const answer = await this.getSectorQuestionAnswer(systemUserId, Number(financialYearId));
        const auditDetail = await this.auditListingDaoService.getAuditHistoryQuestionIdsAndAuditIds(Number(systemUserId));
        const finalAuditDetails = getSectorQuestion?.data?.map(questionObj => {
            const answerObj = answer.find(answers => answers.questionId === questionObj.id);
            const auditorId = auditDetail.find((details) => details.auditerId);
            const questionIdExist = auditDetail.find((details) => details.questionId === questionObj.id);
            if (questionIdExist) {
                return { questionId: questionObj.id, title: questionObj.title, questionType: questionObj.questionType, question: questionObj, answer: answerObj, auditorId: auditorId };
            }
            return null;
        }).filter(Boolean);
        if (getSectorQuestion.data.length) {
            throw new HttpException(
                { status: 200, message: 'Data Found', data: finalAuditDetails, getAssignedDetails: getAssignedDetails },
                HttpStatus.OK,
            );
        } else {
            throw new HttpException({ status: 400, message: 'No active plan found!' }, HttpStatus.CONFLICT);
        }
    }
    async getAuditHistory(req: any) {
        const systemUserId = req.headers.userid;
        const getCompany = await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId);
        const { status, financialYearId } = req.query;
        const frameworkIds = (await this.externalApiCallService.getReq(
            process.env.COMPANY_SERVER_API_URL + 'getFramework',
            { companyId: getCompany.company_id, type: 'ALL', user_type_code: 'company' },
            {},
        )).data.map((obj) => obj.id)
        let auditDetail = await this.auditListingDaoService.getAuditHistoryQuestionIds(financialYearId);
        const getSubUserDetails = await this.userDaoService.getAllUsers();

        if (getCompany.head_office) {
            auditDetail = auditDetail.filter(auditListing => Array.isArray(auditListing.remark) && auditListing.remark.length > 0)
                .map(auditListing => {
                    const filteredRemarks = auditListing.remark
                        .filter(remark => remark.status === status)
                        .map(remark => {
                            const auditor = getSubUserDetails.find(auditor => auditor.id == remark.id);
                            return auditor ? {
                                id: auditor.id,
                                first_name: auditor.first_name,
                                last_name: auditor.last_name,
                                email: auditor.email,
                                position: auditor.position,
                                remark: remark.remark,
                                status: remark.status,
                                auditedDate: remark.auditedDate,
                                answerId: auditListing.answerId
                            } : null;
                        })
                        .filter(result => result !== null);

                    return { ...auditListing, auditDetail: filteredRemarks };
                });

        } else {
            auditDetail = auditDetail
                .filter(auditListing => Array.isArray(auditListing.remark) && auditListing.remark.length > 0)
                .map(auditListing => {
                    const filteredRemarks = auditListing.remark
                        .filter(remark => remark.status === status && remark.id == systemUserId)
                        .map(remark => {
                            const auditor = getSubUserDetails.find(auditor => auditor.id == remark.id);
                            return auditor ? {
                                id: auditor.id,
                                first_name: auditor.first_name,
                                last_name: auditor.last_name,
                                email: auditor.email,
                                position: auditor.position,
                                remark: remark.remark,
                                status: remark.status,
                                auditedDate: remark.auditedDate,
                                answerId: auditListing.answerId
                            } : null;
                        })
                        .filter(result => result !== null);

                    return { ...auditListing, auditDetail: filteredRemarks };
                });

        }
        const questionIds = auditDetail.map((details) => Number(details.questionId));
        if (!questionIds.length) {
            throw new HttpException({ status: 200, message: 'Data Found', data: [], getAssignedDetails: [] }, HttpStatus.OK);
        }
        const queryParam = {
            company_id: getCompany.company_id,
            user_type_code: 'COMPANY',
            framework_ids: frameworkIds,
            qIds: [... new Set(questionIds)],
        };


        const getSectorQuestion = await this.externalApiCallService.getReq(
            process.env.COMPANY_SERVER_API_URL + 'getReportingQuestion',
            queryParam,
            {},
        );

        const answer = await this.getReportingQuestionAnswer(financialYearId, [... new Set(questionIds)]);
        const finalAuditDetails = getSectorQuestion?.data?.map(questionObj => {
            const matchingAuditors = auditDetail.filter((details) => details.questionId === questionObj.questionId);
            matchingAuditors.forEach(item => {
                const answers = answer.find(ans => ans.id == item.answerId);
                item.fromDate = answers?.fromDate;
                item.auditDetail.forEach(detail => {
                    const answers = answer.find(ans => ans.id == detail.answerId);
                    if (answers) {
                        detail.answer = answers;
                        detail.fromDate = answers?.fromDate;
                        detail.frequency = questionObj?.frequency
                    } else {
                        detail.frequency = questionObj?.frequency
                    }
                });
            });
            if (questionObj) {
                return { question: questionObj, questionId: questionObj.id, title: questionObj.title, heading: questionObj.heading, matchingAuditors: matchingAuditors };
            }
            return null;
        }).filter(Boolean);
        if (getSectorQuestion.data.length) {
            throw new HttpException(
                { status: 200, message: 'Data Found', data: finalAuditDetails },
                HttpStatus.OK,
            );
        } else {
            throw new HttpException({ status: 200, message: 'Data Found', data: [], getAssignedDetails: [] }, HttpStatus.OK);
        }
    }


    async getReportingQuestionAnswer(financialYearId: number, qIds: number[]) {
        return await this.reportingModuleDaoService.getReportingQuestionAnswerBasedId(financialYearId, qIds);

    }

    async getSectorQuestionAnswer(userId: any, financialYearId: number) {
        const answer: any[] = [];
        const companyId = (await this.userDaoService.getCompanyDetailsBasedOnUserId(userId)).company_id;
        const getSectorQuestionAnswer = await this.sectorQuestionDaoModuleService.getSectorQuestionAnswer(companyId, financialYearId);
        const getSectorQuestionTabularAnswer = await this.sectorQuestionDaoModuleService.getSectorQuestionTabularAnswer(companyId, financialYearId);
        const tabularAnswerObject: Record<string, any[]> = {};

        getSectorQuestionTabularAnswer.forEach((answer) => {
            tabularAnswerObject[answer.questionId] = tabularAnswerObject[answer.questionId] || [];
            tabularAnswerObject[answer.questionId].push({
                audit_status: answer?.status,
                answer: JSON.parse(answer?.answer),
                proofDocument: answer?.proofDocument,
                id: answer.id,
                note: answer?.note,
                financialYearId: answer.financialYearId,
                userId: userId,
                audit_remark: answer.remark,
                sourceId: answer?.sourceId,
            });
        });

        Object.keys(tabularAnswerObject).forEach((questionId) => {
            const answerObj = {
                questionId: +questionId,
                questionType: 'tabular_question',
                combinedAnswers: tabularAnswerObject[questionId],
                questionnaireType: 'CA',
                status: tabularAnswerObject[questionId][0]['audit_status'],
                id: tabularAnswerObject[questionId][0]['id'],
                note: tabularAnswerObject[questionId][0]['note'],
                answer: Array.from({ length: tabularAnswerObject[questionId][0]['answer']?.length || 0 }, () => Array.from({ length: tabularAnswerObject[questionId][0]['answer']?.[0]?.length || 0 }, () => '')),
            };
            answer.push(answerObj);
        });

        const getSectorQuestionTrendsAnswer = await this.sectorQuestionDaoModuleService.getSectorQuestionTrendsAnswer(companyId, financialYearId);
        const trendsArrayObect: Record<string, any[]> = {};

        getSectorQuestionTrendsAnswer.forEach((trendAnswer) => {
            trendsArrayObect[trendAnswer?.questionId] = trendsArrayObect[trendAnswer?.questionId] || [];
            const answer = JSON.parse(trendAnswer.answer);
            answer['audit_status'] = trendAnswer['status'];
            answer['audit_remark'] = trendAnswer['audit_remark'];
            answer['answered_by_email'] = trendAnswer['answered_by_email'];
            answer['userId'] = trendAnswer['userId'];
            answer['financialYearId'] = trendAnswer['financialYearId'];
            answer['answerId'] = trendAnswer['id'];
            trendsArrayObect[trendAnswer?.questionId].push(answer);
        });

        Object.keys(trendsArrayObect).forEach((questionId) => {
            const answerObj = {
                questionType: 'quantitative_trends',
                questionId: +questionId,
                answer: trendsArrayObect[questionId],
                questionnaireType: 'CA',
                status: trendsArrayObect[questionId][0]['audit_status'],
                id: trendsArrayObect[questionId][0]['id'],
            };
            answer.push(answerObj);
        });
        answer.push(...getSectorQuestionAnswer);
        return answer;
    }

    async assignedQuestionToUser(assignQuestionToAuditorDto: AssignQuestionToAuditorDto, req: any) {
        const systemUserId = req.headers.userid;
        const companyId = (await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId)).company_id;
        const allAssignedMessages: string[] = [];

        for (const questionId of assignQuestionToAuditorDto.questionIds) {
            const auditorData = await this.auditListingDaoService.getExistingRecordAuditor(questionId);
            const viewAuditUsers = auditorData.viewAuditUser.push(assignQuestionToAuditorDto.auditorId);
            const insertedData = await this.auditListingDaoService.updateAuditorToAnswer(questionId, assignQuestionToAuditorDto.auditorId, viewAuditUsers);
            if (insertedData) {
                allAssignedMessages.push(` ${questionId} `);
            }
        }
        if (allAssignedMessages.length > 0) {
            throw new HttpException(
                { status: 200, message: allAssignedMessages },
                HttpStatus.OK,
            );
        }
    }

    async validateAnswers(validateAnswerDto: ValidateAnswerDto, req: any) {
        const systemUserId = req.headers.userid;
        const systemUserInfo = await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId);
        const { questionId, answerId, remark, financialYearId, validation, questionType, questionTitle } = validateAnswerDto;
        const status: QuestionStatus = validation as QuestionStatus;
        const auditorData = await this.auditListingDaoService.getExistingRecordAuditors(questionId, systemUserId, answerId);
        const { id: headOffice } = await this.userDaoService.getCompanyDetailsBasedOnParentIdNull();
        const getHeadOrgDetails = await this.orgChartDaoService.getOrgChartUserId(headOffice);
        const userOrgChart = await this.findUserOrgChart(JSON.parse(getHeadOrgDetails.orgChart), JSON.parse(systemUserId));
        const auditorIds = auditorData.viewAuditUser;
        const parentId = ((await this.subUserDaoService.getSubUserBasedOnCompanyId(Number(systemUserId)))?.parentId);
        if (userOrgChart && parentId) {
            auditorIds.push(String(parentId));
        }

        const uniqueAuditorIds = [...new Set(auditorIds)];
        auditorData.remark = auditorData.remark === null ? [] : auditorData.remark;
        auditorData.remark.push({ id: systemUserId, remark: remark, status: validation, auditedDate: new Date() });
        let updateAuditor;
        if(status === "REJECTED"){
        updateAuditor = await this.auditListingDaoService.updateAuditor(questionId, answerId, auditorData.viewAuditUser, auditorData.remark, null);
        }else{
        updateAuditor = await this.auditListingDaoService.updateAuditor(questionId, answerId, uniqueAuditorIds, auditorData.remark, parentId ? parentId : null);
        }
        await this.reportingModuleDaoService.updateReportingStatusForCustom(answerId, status);
        if (questionType === 'qualitative' || questionType === 'yes_no' || questionType === 'quantitative') {
            await this.sectorQuestionDaoModuleService.updateAllTypeStatus(answerId, status);
        } else if (questionType === 'quantitative_trends') {
            await this.sectorQuestionDaoModuleService.updateTrendsStattus(answerId, status);
        } else if (questionType === 'tabular_question') {
            await this.sectorQuestionDaoModuleService.updateTabular(answerId, status);
        }
        if (updateAuditor) {

            // Create a more descriptive status text based on the QuestionStatus enum
            let statusText;
            switch (status) {
                case QuestionStatus.ACCEPTED:
                    statusText = 'Accepted';
                    break;
                case QuestionStatus.REJECTED:
                    statusText = 'Rejected';
                    break;
                case QuestionStatus.ANSWERED:
                    statusText = 'marked as answered';
                    break;
                default:
                    statusText = status;
            }


            // Create activity log for answer validation
            const activityLog = UserActivityLog.createLog(
                `Audit ${statusText} - ${questionTitle}`,
                'Answer Validation',
                'success',
                systemUserId,
                answerId,
                {
                    questionId: questionId,
                    ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
                    userAgent: req.headers['user-agent'],
                    location: null,
                    viewableChanges: null,
                    metadata: {
                        // Standard fields always present
                        name: `${systemUserInfo.first_name || ''} ${systemUserInfo.last_name || ''}`.trim(),
                        email: systemUserInfo.email,
                        updated_time: new Date().toISOString()
                    }
                }
            );

            // Save the activity log
            await this.userDaoService.insertTodaysActivityData(activityLog);
            await this.dashboardDaoService.insertTodaysActivityData(new TodaysActivity(questionTitle, "Audited", Number(systemUserId), Number(questionId)));

            throw new HttpException(
                { status: 200, message: validation, },
                HttpStatus.OK,
            );
        } else {
            throw new HttpException({ status: 400, message: 'No Question Found!' }, HttpStatus.CONFLICT);
        }
    }

    async validateAllAnswers(req: any) {
        const systemUserId = req.headers.userid;
        const financialYearId = req.body.financialYearId;
        const status: QuestionStatus = 'ACCEPTED' as QuestionStatus;
        const auditorData = await this.auditListingDaoService.getExistingAllRecordAuditors(systemUserId, financialYearId);
        const { id: headOffice } = await this.userDaoService.getCompanyDetailsBasedOnParentIdNull();
        const getHeadOrgDetails = await this.orgChartDaoService.getOrgChartUserId(headOffice);
        const userOrgChart = await this.findUserOrgChart(JSON.parse(getHeadOrgDetails.orgChart), JSON.parse(systemUserId));
        for (const auditor of auditorData) {

            const auditorIds = auditor.viewAuditUser;
            if (userOrgChart && userOrgChart['parentUserId'] !== undefined) {
                auditorIds.push(String(userOrgChart['parentUserId']));
            }


            const uniqueAuditorIds = [...new Set(auditorIds)];
            auditor.remark = [];
            auditor.remark.push({ id: systemUserId, remark: null, status: 'ACCEPTED', auditedDate: new Date() });
            const updateAuditor = await this.auditListingDaoService.updateAuditor(auditor.questionId, auditor.answerId, uniqueAuditorIds, auditor.remark, userOrgChart['parentUserId'] != undefined ? userOrgChart['parentUserId'] : null);

            // // const deletedData = await this.auditListingDaoService.deleteAuditData(questionId, systemUserId, answerId);
            // if (questionType === 'qualitative' || questionType === 'yes_no' || questionType === 'quantitative') {
            //     await this.sectorQuestionDaoModuleService.updateAllTypeStatus(answerId, status);
            // } else if (questionType === 'quantitative_trends') {
            //     await this.sectorQuestionDaoModuleService.updateTrendsStattus(answerId, status);
            // } else if (questionType === 'tabular_question') {
            //     await this.sectorQuestionDaoModuleService.updateTabular(answerId, status);
            // }

        }


        throw new HttpException(
            { status: 200, message: 'Validated', },
            HttpStatus.OK,
        );

    }

    async validateAllLocationAnswers(req: any) {
        const systemUserId = req.headers.userid;
        const { financialYearId, locationId } = req.body;
        const status: QuestionStatus = 'ACCEPTED' as QuestionStatus;
        const reportingData = await this.reportingModuleDaoService.getReportingQuestionAnswerBasedOnLOcation(locationId, financialYearId);
        const ids = reportingData.map(item => item.id);
        const auditorData = await this.auditListingDaoService.getExistingAllLOcationRecordAuditors(ids, financialYearId);
        const { id: headOffice } = await this.userDaoService.getCompanyDetailsBasedOnParentIdNull();
        const getHeadOrgDetails = await this.orgChartDaoService.getOrgChartUserId(headOffice);
        // const userOrgChart = await this.findUserOrgChart(JSON.parse(getHeadOrgDetails.orgChart), JSON.parse(systemUserId));
        for (const auditor of auditorData) {

            // const auditorIds = auditor.viewAuditUser;
            // if (userOrgChart && userOrgChart['parentUserId'] !== undefined) {
            //     auditorIds.push(String(userOrgChart['parentUserId']));
            // }


            // const uniqueAuditorIds = [...new Set(auditorIds)];
            auditor.remark = [];
            auditor.remark.push({ id: 1, remark: null, status: 'ACCEPTED', auditedDate: new Date() });
            const updateAuditor = await this.auditListingDaoService.updateAuditor(auditor.questionId, auditor.answerId, [1], auditor.remark, null);



        }


        throw new HttpException(
            { status: 200, message: 'Validated', },
            HttpStatus.OK,
        );

    }
  private async findUserOrgChartData(targetUserId: string) {
    const systemUserId = targetUserId;
    const { id: headOffice } = await this.userDaoService.getCompanyDetailsBasedOnParentIdNull();
    const getHeadOrgDetails = await this.orgChartDaoService.getOrgChartUserId(headOffice);
    const userOrgChart = await this.findUserOrgCharts(JSON.parse(getHeadOrgDetails.orgChart), Number(systemUserId));
    return userOrgChart;
  }

  private async findUserOrgCharts(orgData: OrgData, targetUserId: number): Promise<OrgData | null> {
    if (Number(orgData.userId) === targetUserId) return orgData;
    for (const child of orgData.children || []) {
      const result = await this.findUserOrgCharts(child, targetUserId);
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

    private async findUserOrgChart(orgData: OrgData, targetUserId: string): Promise<OrgData | null> {
        if (orgData.userId === targetUserId) return orgData;

        for (const child of orgData.children || []) {
            const result = await this.findUserOrgChart(child, targetUserId);
            if (result) return result;
        }

        return null;
    }

}
