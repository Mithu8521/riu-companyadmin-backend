import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as Handlebars from 'handlebars';
import * as path from 'path';
import { HtmlReaderService } from '../html-reader/html-reader.service';


@Injectable()
export class SendMailService {
  private transporter: nodemailer.Transporter;
 private readonly logger = new Logger(SendMailService.name);
  constructor(private readonly htmlReaderService: HtmlReaderService) {
     try {
      Handlebars.registerHelper('formatDate', function (date: string | Date) {
        if (!date) return '';
        const d = new Date(date);
        // adjust locale/format to your preference
        return d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
      });
    } catch (err) {
      // Registering twice throws; ignore if already registered
      this.logger.debug('formatDate helper registration skipped (maybe already registered).');
    }
    this.transporter = nodemailer.createTransport({
      host: 'smtp.office365.com',
      port: 587,
      secure: false,
      auth: {
        user: 'contact@riu.ai',
        pass: 'F$662319675937ox',
        // pass : 'K&202948538672ac'
      },
    });
  }
//pass = K&202948538672ac
  

  async sendMailToMultiple(options: {
    to: string[]; 
    cc?: string[];
    bcc?: string[];
    subject: string;
    html?: string;
    text?: string;
    template?:string;
    replacements:any;
  }) {
    if(!options.to.length){
      throw new BadRequestException('No Recipient Found');

    }
    const html = await this.htmlReaderService.readHTMLFile(
        // path.join(process.cwd(), 'src', options.template)
        path.join(__dirname, options.template)
      );
  const compiledTemplate = Handlebars.compile(html);

    const htmlToSend = compiledTemplate(options.replacements);
    const mailOptions: nodemailer.SendMailOptions = {
      from: process.env.EMAIL_FROM || '"RIU" <contact@riu.ai>',
      to: options.to,
      cc: options.cc && options.cc.length ? options.cc : undefined,
      subject: options.subject,
      html: htmlToSend,
      text: options.text,
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      return result;
    } catch (err) {
      this.logger.error('Error sending mail to multiple recipients', err as any);
      throw err;
    }
  }

  async sendingMail(
    userDetails: any,
    template: string,
    subject: string,
    url: string,
    password: any
  ): Promise<boolean> {
    const email = userDetails.email;
    const name = userDetails.name;

    try {
      const html = await this.htmlReaderService.readHTMLFile(
        path.join(__dirname, template)
      );

      const compiledTemplate = Handlebars.compile(html);
      const replacements = {
        email,
        pass: password,
        url,
        recipientName: name,
        title: userDetails?.title,
        location: userDetails?.location,
        actualValue: userDetails?.actualValue,
        targetValue: userDetails?.targetValue,
        trainar: userDetails?.trainar,
        trainingTitle: userDetails?.trainingTitle,
        topicTitle: userDetails?.topicTitle,
        date: userDetails?.date,
        time: userDetails?.time,
        mettingLink: userDetails?.mettingLink,
      };

      const htmlToSend = compiledTemplate(replacements);

      const mailOptions = {
        from: '"Support RIU" <contact@riu.ai>',
        to: email,
        subject: subject,
        html: htmlToSend,
      };

      const result = await this.transporter.sendMail(mailOptions);
      return result.accepted && result.accepted.length > 0;
    } catch (error) {
      console.error('Error occurred while sending email:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  // Add this common method to your SendMailService class
  async sendEmailReport(
    to: string,
    ccList: string,
    subject: string,
    userDetails: any,
    templatePath: string,
    reportData: any,
    reportType: 'PERFORMANCE_REPORT' | 'DATA_OWNER_REPORT' | 'AUDITOR_REPORT' | 'AUDITOR_APPRECIATION' | 'DATA_OWNER_APPRECIATION' | 'SUSTAINABILITY_INSIGHTS_REPORT',
    attachments,
  ): Promise<boolean> {
    const email = to;
    const name = `${userDetails.first_name} ${userDetails.last_name}`;


    try {
      const html = await this.htmlReaderService.readHTMLFile(
        path.join(__dirname, templatePath)
      );

      const compiledTemplate = Handlebars.compile(html);

      // Create replacements object based on report type
      let replacements: any = {
        // Basic user info (common for all reports)
        recipientName: name,
        email: email,
      };

      // Add specific replacements based on report type
      switch (reportType) {
        case 'PERFORMANCE_REPORT':
          replacements = {
            ...replacements,
            // Header Information
            reportingPeriod: reportData.reportingPeriod,
            generatedDate: reportData.generatedDate,
            reportType: reportData.reportType,
            summaryPeriodText: reportData.summaryPeriodText,
            currentMonth: reportData.currentMonth,
            currentMonthName: reportData.currentMonthName,
            timeframeText: reportData.timeframeText,

            // Bottom Performers
            bottomDataEntryStaff: reportData.bottomDataEntryStaff,
            bottomAuditors: reportData.bottomAuditors,

            // System-Wide Performance Growth
            totalAuditPending: reportData.totalAuditPending,
            auditPendingStatus: reportData.auditPendingStatus,
            auditPendingChange: reportData.auditPendingChange,
            totalAnswerPending: reportData.totalAnswerPending,
            answerPendingStatus: reportData.answerPendingStatus,
            answerPendingChange: reportData.answerPendingChange,
            activeDataOwnersLocationsForAllPeriods: reportData.activeDataOwnersLocationsForAllPeriods,
            activeAuditorsLocationsForAllPeriods: reportData.activeAuditorsLocationsForAllPeriods,
            totalLocations: reportData.totalLocations,
            locationsStatus: reportData.locationsStatus,
            locationsChangeDataOwner: reportData.locationsChangeDataOwner,
            locationsChangeAuditor: reportData.locationsChangeAuditor,
            activeDataEntryStaff: reportData.activeDataEntryStaff,
            dataEntryStaffStatus: reportData.dataEntryStaffStatus,
            dataEntryStaffChange: reportData.dataEntryStaffChange,
            activeAuditors: reportData.activeAuditors,
            auditorsStatus: reportData.auditorsStatus,
            auditorsChange: reportData.auditorsChange,


            bottomDataEntryStaffForCurrentPeriods: reportData.bottomDataEntryStaffForCurrentPeriods,
            bottomAuditorsForCurrentPeriods: reportData.bottomAuditorsForCurrentPeriods,

            totalAuditPendingForCurrentPeriods: reportData.totalAuditPendingForCurrentPeriods,
            auditPendingStatusForCurrentPeriods: reportData.auditPendingStatusForCurrentPeriods,
            auditPendingChangeForCurrentPeriods: reportData.auditPendingChangeForCurrentPeriods,
            totalAnswerPendingForCurrentPeriods: reportData.totalAnswerPendingForCurrentPeriods,
            answerPendingStatusForCurrentPeriods: reportData.answerPendingStatusForCurrentPeriods,
            answerPendingChangeForCurrentPeriods: reportData.answerPendingChangeForCurrentPeriods,
            activeDataOwnersLocationsForCurrentPeriods: reportData.activeDataOwnersLocationsForCurrentPeriods,
            activeAuditorsLocationsForCurrentPeriods: reportData.activeAuditorsLocationsForCurrentPeriods,
            totalLocationsForCurrentPeriods: reportData.totalLocationsForCurrentPeriods,
            locationsStatusForCurrentPeriods: reportData.locationsStatusForCurrentPeriods,
            locationsChangeDataOwnerForCurrentPeriods: reportData.locationsChangeDataOwnerForCurrentPeriods,
            locationsChangeAuditorForCurrentPeriods: reportData.locationsChangeAuditorForCurrentPeriods,
          


            // Cumulative Performance
            dataOwnersWithPending: reportData.dataOwnersWithPending,
            dataOwnersStatus: reportData.dataOwnersStatus,
            dataOwnersChange: reportData.dataOwnersChange,
            totalPendingQuestions: reportData.totalPendingQuestions,
            pendingQuestionsStatus: reportData.pendingQuestionsStatus,
            pendingQuestionsChange: reportData.pendingQuestionsChange,
            auditorsWithPendingAudits: reportData.auditorsWithPendingAudits,
            auditorsWithPendingStatus: reportData.auditorsWithPendingStatus,
            auditorsWithPendingChange: reportData.auditorsWithPendingChange,
            totalPendingAuditQuestions: reportData.totalPendingAuditQuestions,
            pendingAuditQuestionsStatus: reportData.pendingAuditQuestionsStatus,
            pendingAuditQuestionsChange: reportData.pendingAuditQuestionsChange,



            // Data Owner Progress - Current Month
            totalDataOwners: reportData.totalDataOwners,
            totalDataOwnersStatus: reportData.totalDataOwnersStatus,
            totalDataOwnersChange: reportData.totalDataOwnersChange,
            dataOwnersWithPendingCurrent: reportData.dataOwnersWithPendingCurrent,
            dataOwnersWithPendingCurrentStatus: reportData.dataOwnersWithPendingCurrentStatus,
            dataOwnersWithPendingCurrentChange: reportData.dataOwnersWithPendingCurrentChange,
            totalPendingQuestionsCurrent: reportData.totalPendingQuestionsCurrent,
            totalPendingQuestionsCurrentStatus: reportData.totalPendingQuestionsCurrentStatus,
            totalPendingQuestionsCurrentChange: reportData.totalPendingQuestionsCurrentChange,

            // Top Data Owners & Auditors
            topDataOwners: reportData.topDataOwners,
            topAuditors: reportData.topAuditors,

            // Activity Analysis
            mostActiveDataOwners: reportData.mostActiveDataOwners,
            activityRate: reportData.activityRate,
            criticalCasesDataOwners: reportData.criticalCasesDataOwners,
            highPriorityCasesDataOwners: reportData.highPriorityCasesDataOwners,
            newDataOwnersAdded: reportData.newDataOwnersAdded,

            // Auditor Progress
            totalAuditors: reportData.totalAuditors,
            totalAuditorsStatus: reportData.totalAuditorsStatus,
            totalAuditorsChange: reportData.totalAuditorsChange,
            auditorsWithPendingAuditsCurrent: reportData.auditorsWithPendingAuditsCurrent,
            auditorsWithPendingAuditsCurrentStatus: reportData.auditorsWithPendingAuditsCurrentStatus,
            auditorsWithPendingAuditsCurrentChange: reportData.auditorsWithPendingAuditsCurrentChange,
            totalPendingAuditsCurrent: reportData.totalPendingAuditsCurrent,
            totalPendingAuditsCurrentStatus: reportData.totalPendingAuditsCurrentStatus,
            totalPendingAuditsCurrentChange: reportData.totalPendingAuditsCurrentChange,

            // Auditor Efficiency Analysis
            averageAuditsPerAuditor: reportData.averageAuditsPerAuditor,
            criticalCasesAuditors: reportData.criticalCasesAuditors,
            highPriorityCasesAuditors: reportData.highPriorityCasesAuditors,
            mostProductiveCoverage: reportData.mostProductiveCoverage,
            workloadDistribution: reportData.workloadDistribution,

            // Critical Issues & KPIs
            criticalIssues: reportData.criticalIssues,
            keyPerformanceIndicators: reportData.keyPerformanceIndicators,

            // Footer
            preparedBy: reportData.preparedBy,
            nextReportDate: reportData.nextReportDate,
            emergencyContact: reportData.emergencyContact,
          };
          break;

        case 'DATA_OWNER_REPORT':
          replacements = {
            ...replacements,
            // Header Information
            dataOwnerName: reportData.dataOwnerName,
            fromTeam: reportData.fromTeam,
            reportDate: reportData.reportDate,
            reportSubject: reportData.reportSubject,
            reportPeriod: reportData.reportPeriod,

            dueDate:reportData.dueDate,

            // Performance Metrics
            questionsReceived: reportData.questionsReceived,
            questionsAnswered: reportData.questionsAnswered,
            pendingQuestions: reportData.pendingQuestions,

            // Pending Questions Arrays
            immediateActionQuestions: reportData.immediateActionQuestions,
            weeklyPriorityQuestions: reportData.weeklyPriorityQuestions,

            // Summary Metrics
            totalPending: reportData.totalPending,
            overdueQuestions: reportData.overdueQuestions,
            thisWeekQuestions: reportData.thisWeekQuestions,

            // Monthly Trends
            monthlyTrends: reportData.monthlyTrends,

            // Footer Information
            location: reportData.location,
            dataOwnerEmail: reportData.dataOwnerEmail,
            nextReportDate: reportData.nextReportDate,
            contactEmail: reportData.contactEmail,
          };
          break;

        case 'AUDITOR_REPORT':
          // Add auditor-specific replacements here when you create auditor reports
          replacements = {
            ...replacements,
            // Header Information
            auditorName: reportData.auditorName,
            fromTeam: reportData.fromTeam,
            reportDate: reportData.reportDate,
            reportSubject: reportData.reportSubject,
            reportPeriod: reportData.reportPeriod,

            // Performance Metrics
            auditsAssigned: reportData.auditsAssigned,
            auditsCompleted: reportData.auditsCompleted,
            pendingAudits: reportData.pendingAudits,

            // Pending Audits Arrays
            immediateActionAudits: reportData.immediateActionAudits,
            weeklyPriorityAudits: reportData.weeklyPriorityAudits,

            // Summary Metrics
            totalPending: reportData.totalPending,
            overdueAudits: reportData.overdueAudits,
            thisWeekAudits: reportData.thisWeekAudits,

            // Monthly Trends
            monthlyTrends: reportData.monthlyTrends,

            // Footer Information
            auditorEmail: reportData.auditorEmail,
            nextReportDate: reportData.nextReportDate,
            contactEmail: reportData.contactEmail,
          };
          break;

        case 'AUDITOR_APPRECIATION':
          replacements = {
            ...replacements,
            // Header Information
            auditorName: reportData.auditorName,
            fromTeam: reportData.fromTeam,
            reportDate: reportData.reportDate,
            reportSubject: reportData.reportSubject,
            reportPeriod: reportData.reportPeriod,

            // Achievement Metrics
            auditsAssigned: reportData.auditsAssigned,
            auditsCompleted: reportData.auditsCompleted,
            pendingAudits: reportData.pendingAudits,
            completionRate: reportData.completionRate,

            // Achievement Information
            achievementTitle: reportData.achievementTitle,
            achievementDescription: reportData.achievementDescription,

            // Footer Information
            auditorEmail: reportData.auditorEmail,
            contactEmail: reportData.contactEmail,
          };
          break;

        case 'DATA_OWNER_APPRECIATION':
          replacements = {
            ...replacements,
            // Header Information
            dataOwnerName: reportData.dataOwnerName,
            fromTeam: reportData.fromTeam,
            reportDate: reportData.reportDate,
            reportSubject: reportData.reportSubject,
            reportPeriod: reportData.reportPeriod,

            // Achievement Metrics
            questionsAssigned: reportData.questionsAssigned,
            questionsCompleted: reportData.questionsCompleted,
            pendingQuestions: reportData.pendingQuestions,
            completionRate: reportData.completionRate,

            // Achievement Information
            achievementTitle: reportData.achievementTitle,
            achievementDescription: reportData.achievementDescription,

            // Footer Information
            location: reportData.location,
            dataOwnerEmail: reportData.dataOwnerEmail,
            contactEmail: reportData.contactEmail,
          };
          break;

        case 'SUSTAINABILITY_INSIGHTS_REPORT':
          replacements = {
            ...replacements,
            ...reportData
          };
          break;

        default:
          throw new Error(`Unsupported report type: ${reportType}`);
      }

      const htmlToSend = compiledTemplate(replacements);

      const mailOptions = {
        from: '"RIU Reports" <contact@riu.ai>',
        to: to,
        cc: ccList,
        subject: subject,
        html: htmlToSend,
        attachments
      };

      const result = await this.transporter.sendMail(mailOptions);
      return result.accepted && result.accepted.length > 0;
    } catch (error) {
      console.error(`Error occurred while sending ${reportType} email:`, error);
      throw new Error(`Failed to send ${reportType} email: ${error.message}`);
    }
  }

}
