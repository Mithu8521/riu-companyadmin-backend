import { AuditHistoryDaoService } from '@modules/dao/audit/audit-history-dao/audit-history-dao.service';
import { toDate, parse } from 'date-fns';
import { UserDaoService } from '@modules/dao/setting/user-dao/user-dao.service';
import { HttpException, HttpStatus, Injectable, UploadedFile, BadRequestException, InternalServerErrorException, Logger, Req, NotFoundException } from '@nestjs/common';
import { ExternalApiCallService } from '@utils/common/external-api-call/external-api-call.service';
import { SaveAnswerReportingQuestionDto } from './dto/save-reporting_answer.dto';
import { SubUserDaoService } from '@modules/dao/setting/sub-user-dao/sub-user-dao.service';
import { QuestionStatus, QuestionType, QuestionnaireType, ReportingApprovalStatus } from '@utils/enums/Status';
import { ReportingModuleDaoService } from '@modules/dao/reporting-module-dao/reporting-module-dao.service';
import { ReportingQuestionAnswerEntity } from './entities/reporting_question_answer.entity';
import { AnswerFrequencyDaoService } from '@modules/dao/setting/answer-frequency-dao/answer-frequency-dao.service';
import { SectorQuestionDaoModuleService } from '@modules/dao/sector-question-dao-module/sector-question-dao-module.service';
import { SectorQuestionHistoryAnswerEntity } from '@modules/sector_question/entities/sector_question_answers_history.entity';
import { SectorQuestionTabularHistoryAnswerEntity } from '@modules/sector_question/entities/sector_tabular_question_answer_history.entity';
import { SectorQuestionTrendsHistoryAnswerEntity } from '@modules/sector_question/entities/sector_question_trends_answer_history.entity';
import { SectorQuestionAnswerEntity } from '@modules/sector_question/entities/sector_question_answers.entity';
import { SectorQuestionTabularAnswerEntity } from '@modules/sector_question/entities/sector_tabular_question_answer.entity';
import { SectorQuestionTrendsAnswerEntity } from '@modules/sector_question/entities/sector_question_trends_answer.entity';
import { EsgReportingDaoService } from '@modules/dao/esg-reporting-dao/esg-reporting-dao.service';
import { AuditListingEntity } from '@modules/audit/entities/audit_listing.entity';
import { AuditListingDaoService } from '@modules/dao/audit/audit-listing-dao/audit-listing-dao.service';
import { SetTargetDataQuestionDaoService } from '@modules/dao/set_target_data_question-dao/set_target_data_question-dao.service';
import { TodaysActivity } from '@modules/dashboard/entities/today_activity.entity';
import { DashboardDaoService } from '@modules/dao/dashboard-dao/dashboard-dao.service';
import { ReportingQuestionHistoryAnswerEntity } from './entities/reporting_question_answer_history.entity';
import { UserActivityLog } from '@modules/setting/user/entities/user_activity_logs';
import { OrgChartDaoService } from '@modules/dao/setting/org-chart-dao/org-chart-dao.service';
import { SocketService } from '@modules/socket/socket.service';
import { CommonUtilityService } from '@utils/common/common-utility/common-utility.service';
import { TrainingDaoService } from '@modules/dao/training/training-dao/training-dao.service';
import { TraineeDaoService } from '@modules/dao/training/trainee-dao/trainee-dao.service';
import * as MarkdownIt from 'markdown-it';
import * as sup from 'markdown-it-sup';
import { SaveReportingDueDateBulkRequestDto } from './dto/save-reporting_due_date_request.dto';
import { SaveReportingDueDateApproveDto } from './dto/save-reporting_due_date_approve.dto';
import { ReportingDueDateOverrideEntity } from './entities/reporting_question_approval.entity';
import { UnitDaoService } from '../dao/setting/unit-dao/unit-dao.service';
import { AiDashboardDaoService } from '../dao/ai_dashboard-dao/ai_dashboard-dao.service';
import { DataSource, In, Raw } from 'typeorm';
import { SuperAdminClientService } from '../super-admin-client/super-admin-client.service';
import { SourceDaoService } from '@modules/dao/setting/source-dao/source-dao.service';
import { SendMailService } from '@app/utils/common/send-mail/send-mail.service';
import { CloudWatchLogs } from 'aws-sdk';


interface OrgData {
  userId: string;
  orgChart?: any;
  children?: OrgData[];
}

const url = process.env.BASE_URL4;
@Injectable()
export class ReportingModuleService {
  private md = new (MarkdownIt as any)({
    breaks: true,
  }).use(sup);

  private readonly logger = new Logger(ReportingModuleService.name);

  constructor(private externalApiCallService: ExternalApiCallService, private userDaoService: UserDaoService, private subUserDaoService: SubUserDaoService, private reportingModuleDaoService: ReportingModuleDaoService,
    private answerFrequencyDaoService: AnswerFrequencyDaoService, private sectorQuestionDaoModuleService: SectorQuestionDaoModuleService, private esgReportingDaoService: EsgReportingDaoService, private dashboardDaoService: DashboardDaoService,
    private auditListingDaoService: AuditListingDaoService, private setTargetDataQuestionDaoService: SetTargetDataQuestionDaoService,
    private orgChartDaoService: OrgChartDaoService, private socketService: SocketService, private trainingDaoService: TrainingDaoService,
    private traineeDaoService: TraineeDaoService, private unitDaoService: UnitDaoService, private aiDashboardDaoService: AiDashboardDaoService,
    private dataSource: DataSource, private superAdminClientService: SuperAdminClientService, private commonUtilityService: CommonUtilityService,
    private sourceDaoService: SourceDaoService,
    private sendMailService: SendMailService,
    private auditHistoryDaoService: AuditHistoryDaoService
  ) { }


  async getReportingQuestion(systemUserId: any, financialYearId: any, currentRole: any, frameworkIds: any): Promise<any> {
    const getCompany = await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId);

    frameworkIds = getCompany.parent_id
      ? (await this.externalApiCallService.getReq(
        process.env.COMPANY_SERVER_API_URL + 'getFramework',
        { companyId: getCompany.company_id, type: 'ALL', user_type_code: 'company' },
        {},
      )).data.map((obj) => obj.id)
      : frameworkIds;
    let assignedDetail

    const userOrgChart = await this.findUserOrgChartData(systemUserId);
    if (!userOrgChart) {
      throw new HttpException({ status: 200, message: 'No Data Found', data: { teamWorkloadResults: [] } }, HttpStatus.OK);
    }

    const userIds = await this.extractUserIds(userOrgChart);

    if (assignedDetail?.length === 0 && getCompany.parent_id !== null) {
      throw new HttpException(
        { status: 200, message: 'No Data Found', data: [], answers: [], assignedDetails: [] },
        HttpStatus.OK,
      );
    } else {
      const queryParam = {
        company_id: getCompany.company_id,
        user_type_code: 'COMPANY',
        framework_ids: frameworkIds,
        qIds: getCompany.parent_id ? await this.sectorQuestionDaoModuleService.getQuestionIds(userIds, Number(financialYearId)) : undefined,
      };

      if (getCompany.parent_id && queryParam.qIds.length === 0) {
        throw new HttpException(
          { status: 200, message: 'Data Found', data: [], assignedDetail: [] },
          HttpStatus.OK,
        );
      }

      const getSectorQuestion = await this.externalApiCallService.getReq(
        process.env.COMPANY_SERVER_API_URL + 'getReportingQuestion',
        queryParam,
        {},
      );

      const mainQuestions = getSectorQuestion.data;
      const modules = await this.answerFrequencyDaoService.getAnswerFrequency(Number(financialYearId));
      const questionIds = [];
      const auditDetail = await this.auditListingDaoService.getAuditQuestionIdsAndAuditIds([Number(systemUserId)], Number(financialYearId));
      const getSubUserDetails = await this.userDaoService.getAllUsers();

      for (const question of mainQuestions) {
        const matchingModule = modules.find(module => module.moduleId === question.moduleId);
        let matchingAuditors = auditDetail.filter(details => details.questionId === question.questionId);

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
        questionIds.push(question?.questionId);
        if (matchingModule) {
          question.answerFrequency = matchingModule.frequency;
          question.matchingAuditors = matchingAuditors;
        }
      }
      let getAssignedDetails = await this.sectorQuestionDaoModuleService.getAssignedDetails(questionIds, Number(financialYearId) || 6);
      const getUsers = await this.userDaoService.getUsers(true);
      for (const item of getAssignedDetails) {
        const filteredAToDetails = getUsers.filter(obj => item.assignedTo.includes(String(obj.id)));
        const filteredAssignedByDetails = getUsers.filter(obj => [item.assignedBy].includes(obj.id));
        Object.assign(item, { assignedByDetails: filteredAssignedByDetails, assignedToDetails: filteredAToDetails });
      }

      if (mainQuestions.length) {
        throw new HttpException(
          { status: 200, message: 'Data Found', data: mainQuestions, assignedDetail: getAssignedDetails },
          HttpStatus.OK,
        );
      } else {
        throw new HttpException({ status: 400, message: 'No active plan found!' }, HttpStatus.CONFLICT);
      }
    }
  }

  async notifyChatRecipients(
  saved: any,
  roomName: string,
  participants: Array<{ id: number; name: string; email: string }>,
  mailContext: any,
) {
  const senderId = Number(saved.senderId);

  const mentions = saved.mentions ?? { isAll: false, userIds: [] as number[] };
  let targetUserIds: number[] = [];

  if (mentions.isAll) {
    // everyone except sender
    targetUserIds = participants
      .map(p => Number(p.id))
      .filter(id => id !== senderId);
  } else if (Array.isArray(mentions.userIds) && mentions.userIds.length > 0) {
    targetUserIds = mentions.userIds
      .map((id: any) => Number(id))
      .filter(id => Number.isFinite(id) && id !== senderId);
  } else {
    // fallback: all participants except sender
    targetUserIds = participants
      .map(p => Number(p.id))
      .filter(id => id !== senderId);
  }

  if (!targetUserIds.length) return;

  // 🔹 tagged participants (for highlight)
  const taggedParticipants = mentions.isAll
    ? participants.filter(p => Number(p.id) !== senderId)
    : participants.filter(p =>
        (mentions.userIds || [])
          .map(Number)
          .includes(Number(p.id)),
      );

  const rawContent: string = saved.content ?? saved.text ?? '';

  // 🔹 HTML with <span class="tagged-name">…</span>
  const bodyHtml = await this.highlightTaggedNames(
    rawContent,
    taggedParticipants,
    mentions,
  );

  // 🔹 plain text fallback: replace @User(11) -> "Full Name"
  const idToName = new Map<number, string>();
  participants.forEach(p => {
    if (!p?.id) return;
    const nm = (p.name || '').trim();
    idToName.set(Number(p.id), nm || `User ${p.id}`);
  });

  const textPlain = rawContent.replace(/@User\((\d+)\)/g, (_m, idStr) => {
    const id = Number(idStr);
    return idToName.get(id) ?? `User ${id}`;
  });

  const offlineRecipientsForMail: Array<{ id: any; name: string; email: string }> = [];

  for (const userId of targetUserIds) {
    const userIdStr = String(userId);

    
    const isOnline =  this.socketService.isUserOnline(userIdStr);
    const isInRoom =  this.socketService.isUserInRoom(userIdStr, roomName);

    
    if (isInRoom) {
      continue;
    }
   
    const participant = participants.find(p => Number(p.id) === userId);

    const notificationPayload = {
      questionId: saved.questionId,
      financialYearId: saved.financialYearId,
      sourceId: saved.sourceId,
      subLocationId: saved.subLocationId,
      fromDate: saved.fromDate,
      toDate: saved.toDate,
      period: CommonUtilityService.formateDateIntoPeriods(
        saved.fromDate,
        saved.toDate,
      ),
      senderId,
      senderName: mailContext.senderName,
      // 👇 used as plain preview if frontend doesn't render HTML
      text: textPlain,
      // 👇 used by toast + header dropdown to show highlighted names
      bodyHtml,
      title: mailContext?.title,
      financialYear: mailContext?.financialYear,
      answerFrequency: mailContext?.answerFrequency,
      location: mailContext?.location,
    };

    

    if (isOnline) {
      // 🔔 send socket notification with HTML + plain text
      await this.socketService.sendNotificationToUser(
        userIdStr,
        'chatNotification',
        notificationPayload,
      );
      continue;
    }

    // offline: collect for email
    if (participant?.email) {
      offlineRecipientsForMail.push({
        id: participant.id,
        name: participant.name,
        email: participant.email,
      });
    }
  }

  // 📧 send mail for offline users (you already have highlight logic in sendChatToMail)
  if (offlineRecipientsForMail.length > 0) {
    const mailData = {
      ...mailContext,
      text: rawContent,          // raw content (with @User(id))
      mentions: offlineRecipientsForMail,
      mentionsMeta: mentions,    // so sendChatToMail can also highlight correctly
    };

    await this.sendChatToMail(mailData, {
      id: senderId,
      name: mailContext.senderName,
    });
  }
}




  async getReportingModule(req: any) {
    const systemUserId = req.headers.userid;
    const getCompany = await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId);
    const { financialYearId } = req.query

    const frameworkIds = getCompany.parent_id
      ? (await this.externalApiCallService.getReq(
        process.env.COMPANY_SERVER_API_URL + 'getFramework',
        { companyId: getCompany.company_id, type: 'ALL', user_type_code: 'company' },
        {},
      )).data.map((obj) => obj.id)
      : req.query.frameworkIds;
    let assignedDetail
    const userOrgChart = await this.findUserOrgChartData(systemUserId);
    if (!userOrgChart) {
      throw new HttpException({ status: 200, message: 'No Data Found', data: [] }, HttpStatus.OK);
    }

    const userIds = await this.extractUserIds(userOrgChart);
    if (assignedDetail?.length === 0 && getCompany.parent_id !== null) {
      throw new HttpException(
        { status: 200, message: 'No Data Found', data: [], answers: [], assignedDetails: [] },
        HttpStatus.OK,
      );
    } else {
      const queryParam = {
        company_id: getCompany.company_id,
        user_type_code: 'COMPANY',
        framework_ids: frameworkIds,
        qIds: getCompany.parent_id ? await this.sectorQuestionDaoModuleService.getQuestionIds(userIds, Number(financialYearId)) : undefined,
      };

      if (getCompany.parent_id && queryParam.qIds.length === 0) {
        throw new HttpException(
          { status: 200, message: 'Data Found', data: [], assignedDetail: [] },
          HttpStatus.OK,
        );
      }

      const getSectorQuestion = await this.externalApiCallService.getReq(
        process.env.COMPANY_SERVER_API_URL + 'getReportingQuestion',
        queryParam,
        {},
      );

      let mainQuestions = getSectorQuestion.data;
      const uniqueModules = Array.from(
        new Map(
          mainQuestions.map(item => [item.moduleId, { value: item.moduleId, label: item.moduleName }])
        ).values()
      );

      if (uniqueModules.length) {
        throw new HttpException(
          { status: 200, message: 'Data Found', data: uniqueModules },
          HttpStatus.OK,
        );
      } else {
        throw new HttpException({ status: 400, message: 'No active plan found!' }, HttpStatus.CONFLICT);
      }

    }
  }

  async getReportingQuestionAssign(req: any) {
    const systemUserId = req.headers.userid;
    const getCompany = await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId);
    const userOrgChart = await this.findUserOrgChartData(systemUserId);
    if (!userOrgChart) {
      throw new HttpException({ status: 200, message: 'No Data Found', data: { teamWorkloadResults: [] } }, HttpStatus.OK);
    }

    const userIds = await this.extractUserIds(userOrgChart);
    const frameworkIds = getCompany.parent_id
      ? (await this.externalApiCallService.getReq(
        process.env.COMPANY_SERVER_API_URL + 'getFramework',
        { companyId: getCompany.company_id, type: 'ALL', user_type_code: 'company' },
        {},
      )).data.map((obj) => obj.id)
      : req.query.frameworkIds;
    let assignedDetail

    if (assignedDetail?.length === 0 && getCompany.parent_id !== null) {
      throw new HttpException(
        { status: 200, message: 'No Data Found', data: [], answers: [], assignedDetails: [] },
        HttpStatus.OK,
      );
    } else {
      const queryParam = {
        company_id: getCompany.company_id,
        user_type_code: 'COMPANY',
        framework_ids: frameworkIds,
        qIds: getCompany.parent_id ? await this.sectorQuestionDaoModuleService.getQuestionIds(userIds, 6) : undefined,
      };

      const getSectorQuestion = await this.externalApiCallService.getReq(
        process.env.COMPANY_SERVER_API_URL + 'getReportingQuestion',
        queryParam,
        {},
      );


      let mainQuestions = getSectorQuestion.data;
      const modules = await this.answerFrequencyDaoService.getAnswerFrequency(Number(req.query.financialYearId));
      const questionIds = [];
      const auditDetail = await this.auditListingDaoService.getAuditQuestionIdsAndAuditIds([Number(systemUserId)], Number(6));
      const getSubUserDetails = await this.userDaoService.getAllUsers();

      for (const question of mainQuestions) {
        const matchingModule = modules.find(module => module.moduleId === question.moduleId);
        let matchingAuditors = auditDetail.filter(details => details.questionId === question.questionId);

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
        questionIds.push(question?.questionId);
        if (matchingModule) {
          question.answerFrequency = matchingModule.frequency;
          question.matchingAuditors = matchingAuditors;
        }
      }
      let getAssignedDetails = await this.sectorQuestionDaoModuleService.getAssignedDetails(questionIds, Number(req.query.financialYearId) || 6);
      const getUsers = await this.userDaoService.getUsers(true);
      for (const item of getAssignedDetails) {
        const filteredAToDetails = getUsers.filter(obj => item.assignedTo.includes(String(obj.id)));
        const filteredAssignedByDetails = getUsers.filter(obj => [item.assignedBy].includes(obj.id));
        Object.assign(item, { assignedByDetails: filteredAssignedByDetails, assignedToDetails: filteredAToDetails });
      }

      if (mainQuestions.length) {
        throw new HttpException(
          { status: 200, message: 'Data Found', data: mainQuestions, assignedDetail: getAssignedDetails },
          HttpStatus.OK,
        );
      } else {
        throw new HttpException({ status: 400, message: 'No active plan found!' }, HttpStatus.CONFLICT);
      }
    }


  }

  async getAssignedReportingQuestionDetails(req: any) {
    const userId = req.query.userId;
    const systemUserId = req.headers.userid;
    const getCompany = await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId);
    if (userId === "") {
      throw new HttpException(
        { status: 400, data: [], message: "Please select user" },
        HttpStatus.CONFLICT,
      );
    }
    const getAssignedDetails = await this.sectorQuestionDaoModuleService.getQuestionIdBasesAssignedUser(Number(userId));
    if (!getAssignedDetails.length) {
      throw new HttpException(
        { status: 200, data: [], message: "No data found" },
        HttpStatus.OK,
      );
    }
    const headCompany = await this.userDaoService.getHeadOfficeCompanyDetails(true);
    const getESGReport = await this.esgReportingDaoService.getEsgReportingBasedOnUserId(headCompany.id);
    const frameworkTopicKpi = JSON.parse(getESGReport[0]?.frameworkTopicKpi);

    const queryParam = {
      company_id: getCompany.company_id,
      user_type_code: 'COMPANY',
      framework_ids: frameworkTopicKpi?.frameworkId,
      qIds: getAssignedDetails,
    };


    const getSectorQuestion = await this.externalApiCallService.getReq(
      process.env.COMPANY_SERVER_API_URL + 'getReportingQuestion',
      queryParam,
      {},
    );


    throw new HttpException(
      { status: 200, data: getSectorQuestion },
      HttpStatus.OK,
    );
  }

  async highlightTaggedNames(
    messageText: string,
    participants: Array<{ id: number; name: string; email?: string }>,
    mentionsMeta?: { isAll?: boolean; userIds?: number[] },
  ): Promise<string> {
    if (!messageText) return messageText;
  
    let processed = messageText;

    const idToName = new Map<number, string>();
    for (const p of participants) {
      if (!p?.id || !p?.name) continue;
      idToName.set(Number(p.id), p.name);
    }

    
    const regex = /@User\((\d+)\)/g;
    processed = processed.replace(regex, (_match, idStr) => {
      const id = Number(idStr);
      const name = idToName.get(id) ?? `User ${id}`;
      return `<span class="tagged-name">${name}</span>`;
    });

    
    if (mentionsMeta?.isAll) {
      processed = processed.replace(
        /\beveryone\b/gi,
        `<span class="tagged-everyone">Everyone</span>`,
      );
    }

    return processed;
  }


  async sendChatToMail(
  chatData: any,
  senderData?: { name?: string; email?: string; id?: any },
) {
  const sender = await this.userDaoService.getUserDetails([senderData.id]);
  if (sender.length) {
    senderData.email = sender[0].email;
    senderData.name =
      (sender[0].first_name ?? '') + ' ' + (sender[0].last_name ?? '');
  }

  const sendMailTo = Array.isArray(chatData.mentions) ? chatData.mentions : [];

  const emailToName = new Map<string, string>();
   
  // ✅ KEEP id here
  const participants = sendMailTo
    .filter(p => p && p.email)
    .map(p => ({
      id: Number(p.id),
      name: p.name ?? p.fullName ?? deriveNameFromEmail(p.email),
      email: p.email,
    }));

  // ✅ use the content with @User(id) markers if available
  const rawText =
    chatData.content ?? chatData.text ?? '';

  const processedText = await this.highlightTaggedNames(
    rawText,
    participants,
    chatData.mentionsMeta,   // { isAll, userIds }
  );

  for (const p of sendMailTo) {
    if (!p || !p.email) continue;
    emailToName.set(
      String(p.email).toLowerCase(),
      p.name ?? p.fullName ?? '',
    );
  }

  const emailsArray = Array.from(emailToName.keys());
  const senderEmailLower = senderData?.email
    ? String(senderData.email).toLowerCase()
    : null;
  const senderName = senderData?.name;
  const url = chatData.url ?? 'https://www.riu.ai';

  function formatLocation(location: {
    area?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
    unitCode: string;
  }) {
    if (location?.unitCode) return location.unitCode;
    return [
      location?.area,
      location?.city,
      location?.state,
      location?.country,
      location?.zipCode,
    ]
      .filter(Boolean)
      .join(', ');
  }

  const baseReplacements = {
    subject: `New message from ${senderName}`,
    appName: 'RIU Platform',
    appUrl: url,
    lastMessage: {
      senderName,
      text: rawText,             
    },
    messages: rawText,
    processedText,              
    participants,
    title: chatData?.title,
    answerFrequency: chatData?.answerFrequency,
    financialYear: chatData?.financialYear,
    location: formatLocation(chatData?.location),
    frequency: chatData.questionFrequency,
    period: CommonUtilityService.formateDateIntoPeriods(
      chatData.fromDate,
      chatData.toDate,
    ),
  };

  const results: Array<any> = [];

  for (const emailLower of emailsArray) {
    const email = emailLower;
    if (!email) continue;
    if (senderEmailLower && email === senderEmailLower) {
      results.push({ email, status: 'skipped', reason: 'sender' });
      continue;
    }

    const nameFromMap = emailToName.get(email) || '';
    const recipientName = nameFromMap || deriveNameFromEmail(email);

    const replacements = {
      ...baseReplacements,
      recipientName,
      recipientEmail: email,
      conversationId: chatData.conversationId ?? '',
      reportingAnswerId: chatData.reportingAnswerId ?? '',
      url,
    };

    const options: any = {
      to: [email],
      text: rawText,
      template: '/../../../public/views/templates/chat-mail-template.html',
      replacements,
      subject: `New message from ${senderName}`,
    };

    try {
      const res = await this.sendMailService.sendMailToMultiple(options);
      results.push({ email, status: 'sent', res });
    } catch (err) {
      this.logger?.error?.('Error sending mail to', email, err);
      results.push({ email, status: 'failed', error: String(err) });
    }
  }

  return {
    total: emailsArray.length,
    sent: results.filter(r => r.status === 'sent').length,
    skipped: results.filter(r => r.status === 'skipped').length,
    failed: results.filter(r => r.status === 'failed').length,
    results,
  };

  function deriveNameFromEmail(e: string) {
    const local = String(e).split('@')[0] || '';
    return (
      local
        .replace(/[._\-+]/g, ' ')
        .split(' ')
        .map(s => (s ? s[0].toUpperCase() + s.slice(1) : ''))
        .filter(Boolean)
        .join(' ') || e
    );
  }
}




async saveChatsForReportingQueAns(msgData: any) {
  const rawMentions = msgData.mentions || {};
  const mentions = {
    isAll: Boolean(rawMentions.isAll),
    userIds: Array.isArray(rawMentions.userIds)
      ? rawMentions.userIds
          .map((id: any) => Number(id))
          .filter((id: number) => Number.isFinite(id))
      : [],
  };

  const content = msgData.content ?? '';

  const appendChat = {
    questionId: Number(msgData.questionId),
    financialYearId: Number(msgData.financialYearId),
    sourceId: msgData.sourceId != null ? Number(msgData.sourceId) : null,
    subLocationId: msgData.subLocationId != null ? Number(msgData.subLocationId) : null,
    fromDate: msgData.fromDate ?? null,
    toDate: msgData.toDate ?? null,
    senderId: msgData.senderId != null ? Number(msgData.senderId) : null,
    content,
    mentions,  
  };

  this.logger.debug('saveChatsForReportingQueAns appendChat', appendChat);

  return this.reportingModuleDaoService.appendMessege(appendChat);
}


  async appendChatMessageFlow(msgData: any, currentUserId: number) {
    const senderName = msgData?.currentUserName ?? '';
    if ('currentUserName' in msgData) {
      delete msgData.currentUserName;
    }

    const saved: any = await this.saveChatsForReportingQueAns({
      ...msgData,
      senderId: currentUserId,
      senderName,
    });
    if (!saved.questionId || !saved.financialYearId || !saved.sourceId) {
      throw new BadRequestException('Required fields are missing')
    }
    const roomName = `chat_${saved.questionId}_${saved.financialYearId}_${saved.sourceId}_${saved.subLocationId || "NULL"}_${saved.fromDate || "NULL"}_${saved.toDate || "NULL"}`;

    const payload = {
      id: saved.id,
      questionId: saved.questionId,
      financialYearId: saved.financialYearId,
      sourceId: saved.sourceId,
      subLocationId: saved.subLocationId,
      fromDate: saved.fromDate,
      toDate: saved.toDate,
      content: saved.content,
      senderId: currentUserId,
      senderName: senderName,
      mentions: saved.mentions,
      createdAt: saved.createdAt,
    };

    const participants = await this.getParticipantsForChat({
      dataOwnerId: msgData.dataOwnerId,
      questionId: saved.questionId,
      financialYearId: saved.financialYearId,
      sourceId: msgData.sourceId,
      subLocationId: msgData.subLocationId,
      fromDate: msgData.fromDate,
      toDate: msgData.toDate,
    }, currentUserId);


    const mailContext = {
      ...(msgData?.questionDetailsForMail ?? {}),
      senderName: senderName,
    };

    return {
      saved,
      roomName,
      payload,
      participants,
      mailContext,
    };
  }

  private async getUserParentChain(userId: number): Promise<any[]> {
    let current: any = await this.findUserOrgChartDataDirect(String(userId));
    return current;
  }

  private flattenUsers(node: any, list: any[] = []) {
    list.push(node);
    if (node.children?.length) {
      node.children.forEach((child: any) => this.flattenUsers(child, list));
    }
    return list;
  }

 


async getAssignedDataOwner(filter: any): Promise<any> {
    const { financialYearId, questionId, sourceId } = filter;
  
    const assignmentRecord = await this.reportingModuleDaoService.getUserQuestionMapping({financialYearId,questionId});

    if (!assignmentRecord || !assignmentRecord.assignedTo || assignmentRecord.assignedTo.length === 0) {
      return [];
    }

    const assignedUserIds = assignmentRecord.assignedTo;
    const assignedUserIdsList = assignedUserIds.map(id => Number(id));

    const allAssignedUsers = await this.reportingModuleDaoService.getDataOwner(assignedUserIdsList);

    if (!allAssignedUsers || allAssignedUsers.length === 0) {
        return [];
    } 
    const matchingDataOwners = allAssignedUsers.filter(user => {
        const userSourceIds = JSON.parse(user.sourceId);
        return userSourceIds.includes(Number(sourceId));
    });

    return matchingDataOwners;
}
  
  async getParticipantsForChat(filter: any, currentUserId?: any) {
    if (!filter) return [];
    
    const dataOwnerResult = await this.getAssignedDataOwner({
      financialYearId: filter.financialYearId,
      sourceId: filter.sourceId,
      questionId: filter.questionId,
    });

    const resolvedDataOwnerId =
      Array.isArray(dataOwnerResult) && dataOwnerResult.length
        ? Number(dataOwnerResult[0].companyId)
        : null

    if (!resolvedDataOwnerId) {
      return [];
    }

    const orgTree = await this.getUserParentChain(resolvedDataOwnerId);
    const flatList = this.flattenUsers(orgTree);
    const userIdToUserMap = new Map<number, any>();
    
    const idToUserMap = new Map<string, any>();
    flatList.forEach(u => {
        userIdToUserMap.set(u.userId, u);
        idToUserMap.set(u.id, u); 
    });
    
    let parents: number[] = [];
    let current = userIdToUserMap.get(Number(resolvedDataOwnerId));

    
    while (current?.parentNodeId) {
      const parent = idToUserMap.get(current.parentNodeId);   
      if (!parent) break;
      if (
        parent.role !== "Internal Auditor" &&
        parent.role !== "External Auditor"
      ) {
        
        parents.push(parent.userId);
      }
      current = parent; 
    }
    
    

    
    const query = this.buildWhereFilterForReportingAnswer(filter);
    const existingRecord = await this.reportingModuleDaoService.getRecordsBasedOnFilters(query);
    let auditorIds: number[] = [];

    if (existingRecord) {
      const baseFilter = {
        questionId: CommonUtilityService.toRequiredNumber(filter.questionId, 'questionId'),
        financialYearId: CommonUtilityService.toRequiredNumber(filter.financialYearId, 'financialYearId'),
        sourceId: CommonUtilityService.toOptionalNumber(filter.sourceId),
        subLocationId: CommonUtilityService.toOptionalNumber(filter.subLocationId),
        fromDate: CommonUtilityService.normalizeDateString(filter.fromDate),
        toDate: CommonUtilityService.normalizeDateString(filter.toDate),
      };

      const auditData =
        await this.auditListingDaoService.getAuditorListByReportingQuestionAnswerId(
          existingRecord.id,
        );

      const remarkIds: number[] = (auditData?.remark ?? [])
        .map((remark: any) => Number(remark.id))
        .filter((id: number) => Number.isFinite(id));

      const auditorId =
        auditData?.auditerId != null ? Number(auditData.auditerId) : null;
      const loggedInUserId = currentUserId ? Number(currentUserId) : null;

      const auditorIdList = [
        ...new Set<number>([
          ...remarkIds,
          ...(auditorId ? [auditorId] : []),
        ]),
      ].filter(id => Number.isFinite(id));

      let finalAuditorIds: number[] = [];

      if (auditorIdList.length) {
        const chats =
          await this.reportingModuleDaoService.getChatByUserIds({
            baseFilter,
            senderIds: auditorIdList,
          });

        const chattedAuditors = new Set<number>(
          (chats || []).map(c => Number(c.senderId)),
        );

        for (const id of auditorIdList) {
          // logged-in auditor => included for chat status check
          if (loggedInUserId && id === loggedInUserId) {
            finalAuditorIds.push(id);
            continue;
          }

          // include only if chat exists
          if (chattedAuditors.has(id)) {
            finalAuditorIds.push(id);
          }
        }
      }

      auditorIds = finalAuditorIds;
    }

    const uniqueIds = new Set<number>([
      ...parents,
      ...auditorIds,
      Number(resolvedDataOwnerId), 
    ]);

    if (currentUserId) {
      const userId = Number(currentUserId);
      if (!uniqueIds.has(userId)) {
        const currentUserData = userIdToUserMap.get(userId); 
        const currentUserRole = currentUserData?.role;
        const isAuditor =
          currentUserRole === "Internal Auditor" ||
          currentUserRole === "External Auditor";

        if (!isAuditor || existingRecord) {
          uniqueIds.add(userId);
        }
      }
    }

    const finalIds = [...uniqueIds].filter(id => id > 0);
    const userData = await this.userDaoService.getUserDetails(finalIds);

    const participants = userData
      .filter(user => finalIds.includes(user.id))
      .map((data) => ({
        id: data.id,
        name: `${data.first_name} ${data.last_name}`,
        email: data.email,
      }));

    return participants;
  }



  buildWhereFilterForReportingAnswer(filter: any) {
    const where: any = {};

    if (filter.financialYearId) {
      where.financialYearId = Number(filter.financialYearId);
    }

    if (filter.sourceId) {
      where.sourceId = Number(filter.sourceId);
    }
    if (filter.questionId) {
      where.questionId = Number(filter.questionId);
    }
    if (filter.subLocationId && filter.subLocationId != "null" && filter.subLocationId != 'undefined') {
      where.subLocationId = Number(filter.subLocationId);
    }

    if (
      filter.fromDate &&
      filter.toDate &&
      filter.fromDate !== "null" &&
      filter.toDate !== "null" &&
      filter.fromDate !== "undefined" &&
      filter.toDate !== "undefined"
    ) {

      where.fromDate = filter.fromDate;
      where.toDate = filter.toDate;
    }

    return { where };
  }

  async getChatsForAnswer(filter: any) {
    const userId = Number(filter.currentUserId);
    if (!userId) {
      console.warn('getChatsForAnswer invalid params', { userId, raw: filter });
      return [];
    }

    const orgTree = await this.getUserParentChain(userId);
    const flatList = this.flattenUsers(orgTree);
    const user = flatList.find(u => u.userId === userId);
    let sendUser: any = {}
    if (user) {
      sendUser.id = user?.id
      sendUser.name = user?.name,
        sendUser.roleId = user.roleId
      sendUser.role = user.role
    }
 
    const baseFilter = {
      questionId: CommonUtilityService.toRequiredNumber(filter.questionId, 'questionId'),
      financialYearId: CommonUtilityService.toRequiredNumber(filter.financialYearId, 'financialYearId'),
      sourceId: CommonUtilityService.toOptionalNumber(filter.sourceId),
      subLocationId: CommonUtilityService.toOptionalNumber(filter.subLocationId),
      fromDate: filter.fromDate || null,
      toDate: filter.toDate || null,
    };

    if (!baseFilter.questionId || !baseFilter.financialYearId) {
      throw new BadRequestException('questionId and financialYearId are required and must be valid numbers');
    }


    if (user.role === "Internal Auditor" || user.role === "External Auditor") {
      const firstChatFilter = {
        where: {
          senderId: userId,
          ...baseFilter,
        },
      };

      const firstchat = await this.reportingModuleDaoService.firstChatForAuditorUser(firstChatFilter);

      if (!firstchat) {
        delete user?.children;
        return { chats: [], user: sendUser };
      }

      const chatFilter = {
        ...baseFilter,
        createdAt: firstchat.createdAt,
      };

      const chats = await this.reportingModuleDaoService.getChatFromFilter(chatFilter)
      return { chats, user: sendUser };
    }

    // Non-auditors: get all chats for this context
    const chats = await this.reportingModuleDaoService.getChatFromFilter(baseFilter)
    return { chats, user: sendUser };
  }



  async saveAnswerReportingQuestion(saveAnswerReportingQuestionDto: SaveAnswerReportingQuestionDto, req: any) {
    const systemUserId = req.headers.userid;
    const { financialYearId, questionId, questionType, answer, sourceId, fromDate, toDate, notApplicable, proofDocument, proofDocumentNote, note, frequency, moduleId, questionTitle, readingValue, subLocationId } = saveAnswerReportingQuestionDto;
    const parentId = ((await this.subUserDaoService.getSubUserBasedOnCompanyId(Number(systemUserId)))?.parentId);
    const company = await this.userDaoService.getHeadOfficeCompanyDetails(true);
    const companyId = (await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId)).company_id;
    const systemUserInfo = await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId);

    let frameworkIds = (await this.externalApiCallService.getReq(
      process.env.COMPANY_SERVER_API_URL + 'getFramework',
      { companyId: companyId, type: 'ALL', user_type_code: 'company' },
      {},
    )).data.map((obj) => obj.id)

    if (!sourceId) {
      throw new HttpException({ status: 400, message: 'No Location found!' }, HttpStatus.CONFLICT);

    }
    const questionnaireType: QuestionnaireType = 'CA' as QuestionnaireType;
    const status: QuestionStatus = 'ANSWERED' as QuestionStatus;

    const assignedDetails = await this.sectorQuestionDaoModuleService.getAssignDetailsBasedOnQuestionIdAndAssignedToId(systemUserId, questionId, financialYearId);
    const assignedByUserDetails = await this.userDaoService.getCompanyDetailsBasedOnUserId(assignedDetails?.assignedBy);
    const auditorId = !parentId ? assignedByUserDetails.id : parentId;
    let isUpdate = false;

    if (frequency === "ONE_TIME") {
      const existingRecord = await this.reportingModuleDaoService.getExistingRecordForOneTime(financialYearId, questionId, sourceId);
      if (existingRecord) {
        isUpdate = true;
        const historyEntity = this.createReportingAnswerHistoryEntity(existingRecord);
        await this.reportingModuleDaoService.saveReportingQuestionHistoryAnswer(historyEntity);
        const answerEntity = this.createReportingAnswerEntity(systemUserId, financialYearId, questionId, sourceId, subLocationId, moduleId, fromDate, toDate, notApplicable, answer, proofDocument, proofDocumentNote, note, questionType as QuestionType, companyId, questionnaireType, status);
        await this.reportingModuleDaoService.updateReportingQuestionAnswerForOneTime(questionId, financialYearId, answerEntity);
        await this.auditListingDaoService.updateAuditorId(existingRecord.id, auditorId);
        // await this.processDaoService.updateDeletable(trends["process"]);
      } else if (existingRecord === null) {
        isUpdate = false;
        const answerEntity = this.createReportingAnswerEntity(systemUserId, financialYearId, questionId, sourceId, subLocationId, moduleId, fromDate, toDate, notApplicable, answer, proofDocument, proofDocumentNote, note, questionType as QuestionType, companyId, questionnaireType, status);
        const insertAnswer = await this.reportingModuleDaoService.saveReportingQuestionAnswer(answerEntity);
        await this.auditListingDaoService.insertAuditData(new AuditListingEntity(
          questionType as QuestionType, companyId, financialYearId, questionId, questionnaireType, insertAnswer.id, auditorId, [auditorId, assignedDetails?.assignedBy, systemUserId], status));
        // const massage = `${item?.title}`
        // await this.dashboardDaoService.insertTodaysActivityData(new TodaysActivity(massage, "Answered", systemUserId, item.questionId));
      }
    } else if (frequency === "EVERY_FY") {
      const existingRecord = await this.reportingModuleDaoService.getExistingRecordForEveryFY(questionId, sourceId, financialYearId);
      if (existingRecord) {
        isUpdate = true;
        const historyEntity = this.createReportingAnswerHistoryEntity(existingRecord);
        await this.reportingModuleDaoService.saveReportingQuestionHistoryAnswer(historyEntity);
        const answerEntity = this.createReportingAnswerEntity(systemUserId, financialYearId, questionId, sourceId, subLocationId, moduleId, fromDate, toDate, notApplicable, answer, proofDocument, proofDocumentNote, note, questionType as QuestionType, companyId, questionnaireType, status);
        await this.reportingModuleDaoService.updateReportingQuestionAnswerForEveryFY(questionId, financialYearId, answerEntity);
        await this.auditListingDaoService.updateAuditorId(existingRecord.id, auditorId);
      } else if (existingRecord === null) {
        isUpdate = false;
        const answerEntity = this.createReportingAnswerEntity(systemUserId, financialYearId, questionId, sourceId, subLocationId, moduleId, fromDate, toDate, notApplicable, answer, proofDocument, proofDocumentNote, note, questionType as QuestionType, companyId, questionnaireType, status);
        const insertAnswer = await this.reportingModuleDaoService.saveReportingQuestionAnswer(answerEntity);
        await this.auditListingDaoService.insertAuditData(new AuditListingEntity(questionType as QuestionType, companyId, financialYearId, questionId, questionnaireType, insertAnswer.id, auditorId, [auditorId, assignedDetails?.assignedBy, systemUserId], status));
        // const massage = `${item?.title}`
        // await this.dashboardDaoService.insertTodaysActivityData(new TodaysActivity(massage, "Answered", systemUserId, item.questionId));
      }
    } else if (frequency === "CUSTOM") {
      const existingRecord = subLocationId ? await this.reportingModuleDaoService.getExistingRecordForCustoms(questionId, sourceId, financialYearId, fromDate, toDate, subLocationId) : await this.reportingModuleDaoService.getExistingRecordForCustom(questionId, sourceId, financialYearId, fromDate, toDate);
      if (existingRecord) {
        isUpdate = true;
        const historyEntity = this.createReportingAnswerHistoryEntity(existingRecord);
        await this.reportingModuleDaoService.saveReportingQuestionHistoryAnswer(historyEntity);
        const answerEntity = this.createReportingAnswerEntity(systemUserId, financialYearId, questionId, sourceId, subLocationId, moduleId, fromDate, toDate, notApplicable, answer, proofDocument, proofDocumentNote, note, questionType as QuestionType, companyId, questionnaireType, status);
        subLocationId ? await this.reportingModuleDaoService.updateReportingQuestionAnswerForSubForCustom(questionId, financialYearId, sourceId, subLocationId, fromDate, toDate, answerEntity) : await this.reportingModuleDaoService.updateReportingQuestionAnswerForCustom(questionId, financialYearId, sourceId, fromDate, toDate, answerEntity);
        const targetValueDta = await this.setTargetDataQuestionDaoService.getExistingTergetValue(questionId, sourceId, fromDate, toDate);
        await this.auditListingDaoService.updateAuditorId(existingRecord.id, auditorId);
        //         if (questionType === 'tabular_question') {
        //           const exceedMessage = req.body.exceedMessage
        //           // const result = this.compareAndGetExceeds(answer,  targetValueDta?.targetData);
        //           const sourceData = await this.sourceDaoService.getSourceBasedOnId(sourceId);
        //           const location = JSON.parse(sourceData?.location);
        //           coxnst { id: headOffice } = await this.userDaoService.getCompanyDetailsBasedOnParentIdNull();
        //           const getHeadOrgDetails = await this.orgChartDaoService.getOrgChartUserId(headOffice);
        //           const userOrgChart = await this.findAllParents(JSON.parse(getHeadOrgDetails.orgChart), Number(systemUserId));
        //           const getCompany = await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId);
        //           const frameworkIds = (await this.externalApiCallService.getReq(
        //             process.env.COMPANY_SERVER_API_URL + 'getFramework', { companyId: getCompany.company_id, type: 'ALL', user_type_code: 'company' }, {},
        //           )).data.map((obj) => obj.id);

        //           const queryParam = {
        //             company_id: getCompany.company_id,
        //             user_type_code: 'COMPANY',
        //             framework_ids: frameworkIds,
        //             qIds: undefined,
        //           };

        //           const getSectorQuestion = await this.externalApiCallService.getReq(
        //             process.env.COMPANY_SERVER_API_URL + 'getTriggerQuestion',
        //             queryParam,
        //             {},
        //           );

        //           let mainQuestions = getSectorQuestion.data;
        //           const filteredData = mainQuestions.filter(item => {
        //             try {
        //               const formulas = JSON.parse(item.formula);
        //               return formulas.flat().some(entry => entry.includes(32));
        //             } catch (e) {
        //               console.error("Invalid formula format", e);
        //               return false;
        //             }
        //           });


        //           for (const obj of filteredData) {
        //             const idsArray = this.extractIdsFromFormula(obj.formula);
        //             let reportingAnswer = await this.reportingModuleDaoService.getReportingQuestionAnswerBasedId(Number(financialYearId),idsArray);
        //             const allIdsPresent = idsArray.every(id => reportingAnswer.some(answer => answer.questionId === id));
        //             // if(questionId === 20 && reportingAnswer.length>0){
        //             //   reportingAnswer = reportingAnswer[reportingAnswer.length -1]
        //             // }
        //             let tmpAnswer;

        //             if (allIdsPresent) {
        //               if ((obj.questionType === "qualitative") || (obj.questionType === "yes_no") || (obj.questionType === "quatitative")) {
        //                 tmpAnswer = await this.calculateFinalAnswerForOtherType(reportingAnswer, obj.formula);


        //               } else if (obj.questionType === "tabular_question") {
        //                 tmpAnswer = await this.calculateFinalAnswer(reportingAnswer, JSON.parse(obj.formula));

        // console.log(tmpAnswer)

        //               } else if (obj.questionType === "quantitative_trends") {
        //                 tmpAnswer = await this.calculateFinalTrendsAnswer(reportingAnswer, obj.formula);

        //               }
        //             }
        //           }

        //           for (let i = 0; i < userOrgChart.length; i++) {
        //             if (userOrgChart[i]?.userId) {
        //               const eventName = `notification${userOrgChart[i]?.userId}`;
        //               const loc = `${location['area']}, ${location['city']}, ${location['state']}, ${location['country']} - ${location['zipCode']}`;
        //               const massage = `${questionTitle} by your company at location: ${loc} ${exceedMessage}`;
        //               this.socketService.sendNotificationToUser(String(userOrgChart[i]?.userId), eventName, massage);
        //               await this.userDaoService.insertNewNotification(new UserNotificationEntity(massage, [questionId], Number(userOrgChart[i]?.userId), systemUserId));
        //               const getUserDetails = await this.userDaoService.getCompanyDetailsBasedOnUserId(userOrgChart[i]?.userId);
        //               const userInformation = {
        //                 name: getUserDetails?.first_name + ' ' + getUserDetails?.last_name,
        //                 email: getUserDetails?.email,
        //                 location: loc,
        //                 title: questionTitle,
        //                 actualValue: Number(readingValue),
        //                 targetValue: exceedMessage,
        //               };

        //               await this.sendMailService.sendingMail(
        //                 userInformation,
        //                 '/../../../public/views/templates/exceed-pointtab.html',
        //                 'Welcome to RIU',
        //                 url,
        //                 Number(readingValue) - Number(targetValueDta?.targetData)
        //               );

        //             }
        //           }
        //         } else {
        //           if (targetValueDta) {
        //             const sourceData = await this.sourceDaoService.getSourceBasedOnId(sourceId);
        //             const location = JSON.parse(sourceData?.location);
        //             const { id: headOffice } = await this.userDaoService.getCompanyDetailsBasedOnParentIdNull();
        //             const getHeadOrgDetails = await this.orgChartDaoService.getOrgChartUserId(headOffice);
        //             const userOrgChart = await this.findAllParents(JSON.parse(getHeadOrgDetails.orgChart), Number(systemUserId));
        //             for (let i = 0; i < userOrgChart.length; i++) {
        //               if (userOrgChart[i]?.userId) {
        //                 const eventName = `notification${userOrgChart[i]?.userId}`;
        //                 const loc = `${location['area']}, ${location['city']}, ${location['state']}, ${location['country']} - ${location['zipCode']}`;
        //                 const massage = `${questionTitle} by your company at location: ${loc} Exceeded Value: ${Number(targetValueDta?.targetData) - Number(readingValue)} kl`;
        //                 this.socketService.sendNotificationToUser(String(userOrgChart[i]?.userId), eventName, massage);
        //                 await this.userDaoService.insertNewNotification(new UserNotificationEntity(massage, [questionId], Number(userOrgChart[i]?.userId), systemUserId));
        //                 const getUserDetails = await this.userDaoService.getCompanyDetailsBasedOnUserId(userOrgChart[i]?.userId);
        //                 const userInformation = {
        //                   name: getUserDetails?.first_name + ' ' + getUserDetails?.last_name,
        //                   email: getUserDetails?.email,
        //                   location: loc,
        //                   title: questionTitle,
        //                   actualValue: Number(readingValue),
        //                   targetValue: Number(targetValueDta?.targetData),
        //                 };
        //                 if (targetValueDta && Number(targetValueDta?.targetData) < Number(readingValue)) {
        //                   await this.sendMailService.sendingMail(
        //                     userInformation,
        //                     '/../../../public/views/templates/exceed-point.html',
        //                     'Welcome to RIU',
        //                     url,
        //                     Number(readingValue) - Number(targetValueDta?.targetData)
        //                   );
        //                 }
        //               }
        //             }
        //           }
        //         }


        await this.dashboardDaoService.insertTodaysActivityData(new TodaysActivity(questionTitle, "Updated", systemUserId, questionId));

        // ✅ If sublocation updated, calculate parent SUM
        if (subLocationId && questionType === 'tabular_question') {
          await this.updateParentSumForReportingAnswer(financialYearId, questionId, sourceId, fromDate, toDate, systemUserId, moduleId, notApplicable, proofDocument, proofDocumentNote, note, companyId, questionnaireType, status, questionType as QuestionType);
        }

      } else if (existingRecord === null) {
        isUpdate = false;
        const answerEntity = this.createReportingAnswerEntity(systemUserId, financialYearId, questionId, sourceId, subLocationId, moduleId, fromDate, toDate, notApplicable, answer, proofDocument, proofDocumentNote, note, questionType as QuestionType, companyId, questionnaireType, status);
        const insertAnswer = await this.reportingModuleDaoService.saveReportingQuestionAnswer(answerEntity);
        await this.auditListingDaoService.insertAuditData(new AuditListingEntity(questionType as QuestionType, companyId, financialYearId, questionId, questionnaireType, insertAnswer.id, auditorId, [auditorId, assignedDetails?.assignedBy, systemUserId], status));
        const targetValueDta = await this.setTargetDataQuestionDaoService.getExistingTergetValue(questionId, sourceId, fromDate, toDate);
        // if (questionType === 'tabular_question') {
        //   const exceedMessage = req.body.exceedMessage
        //   // const result = this.compareAndGetExceeds(answer,  targetValueDta?.targetData);
        //   const sourceData = await this.sourceDaoService.getSourceBasedOnId(sourceId);
        //   const location = JSON.parse(sourceData?.location);
        //   const { id: headOffice } = await this.userDaoService.getCompanyDetailsBasedOnParentIdNull();
        //   const getHeadOrgDetails = await this.orgChartDaoService.getOrgChartUserId(headOffice);
        //   const userOrgChart = await this.findAllParents(JSON.parse(getHeadOrgDetails.orgChart), Number(systemUserId));
        //   const getCompany = await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId);
        //   const frameworkIds = (await this.externalApiCallService.getReq(
        //     process.env.COMPANY_SERVER_API_URL + 'getFramework', { companyId: getCompany.company_id, type: 'ALL', user_type_code: 'company' }, {},
        //   )).data.map((obj) => obj.id);

        //   const queryParam = {
        //     company_id: getCompany.company_id,
        //     user_type_code: 'COMPANY',
        //     framework_ids: frameworkIds,
        //     qIds: undefined,
        //   };

        //   const getSectorQuestion = await this.externalApiCallService.getReq(
        //     process.env.COMPANY_SERVER_API_URL + 'getTriggerQuestion',
        //     queryParam,
        //     {},
        //   );

        //   let mainQuestions = getSectorQuestion.data;
        //   const filteredData = mainQuestions.filter(item => {
        //     try {
        //       // Parse the formula into an array
        //       const formulas = JSON.parse(item.formula);
        //       // Flatten the array and check if the target ID (substring) exists
        //       return formulas.flat().some(entry => entry.includes(32));
        //     } catch (e) {
        //       console.error("Invalid formula format", e);
        //       return false;
        //     }
        //   });
        //   // const formula = 'q1+q2';
        //   // const idsArray = this.extractIdsFromFormula('Q1+Q2');
        //   // let reportingAnswer = await this.reportingModuleDaoService.getReportingQuestionAnswerBasedId(1,idsArray);

        //   // const tmpAnswer;
        //   // if (questionType === "qualitative" || questionType === "yes_no" || questionType === "quantitative") {
        //   //   tmpAnswer = await this.calculateFinalAnswerForOtherType(reportingAnswer, formula);
        //   // } else if (obj.questionType === "tabular_question") {
        //   //   tmpAnswer = await this.calculateFinalAnswer(reportingAnswer, JSON.parse(formula));
        //   // } else if (obj.questionType === "quantitative_trends") {
        //   //   tmpAnswer = await this.calculateFinalTrendsAnswer(reportingAnswer, formula);
        //   // }
        //   for (let i = 0; i < userOrgChart.length; i++) {
        //     if (userOrgChart[i]?.userId) {
        //       const eventName = `notification${userOrgChart[i]?.userId}`;
        //       const loc = `${location['area']}, ${location['city']}, ${location['state']}, ${location['country']} - ${location['zipCode']}`;
        //       const massage = `${questionTitle} by your company at location: ${loc} ${exceedMessage}`;
        //       this.socketService.sendNotificationToUser(String(userOrgChart[i]?.userId), eventName, massage);
        //       await this.userDaoService.insertNewNotification(new UserNotificationEntity(massage, [questionId], Number(userOrgChart[i]?.userId), systemUserId));
        //       const getUserDetails = await this.userDaoService.getCompanyDetailsBasedOnUserId(userOrgChart[i]?.userId);
        //       const userInformation = {
        //         name: getUserDetails?.first_name + ' ' + getUserDetails?.last_name,
        //         email: getUserDetails?.email,
        //         location: loc,
        //         title: questionTitle,
        //         actualValue: Number(readingValue),
        //         targetValue: exceedMessage,
        //       };

        //       await this.sendMailService.sendingMail(
        //         userInformation,
        //         '/../../../public/views/templates/exceed-pointtab.html',
        //         'Welcome to RIU',
        //         url,
        //         Number(readingValue) - Number(targetValueDta?.targetData)
        //       );

        //     }
        //   }
        // } else {
        //   if (targetValueDta) {
        //     const sourceData = await this.sourceDaoService.getSourceBasedOnId(sourceId);
        //     const location = JSON.parse(sourceData?.location);
        //     const { id: headOffice } = await this.userDaoService.getCompanyDetailsBasedOnParentIdNull();
        //     const getHeadOrgDetails = await this.orgChartDaoService.getOrgChartUserId(headOffice);
        //     const userOrgChart = await this.findAllParents(JSON.parse(getHeadOrgDetails.orgChart), Number(systemUserId));
        //     const getCompany = await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId);
        //     const frameworkIds = (await this.externalApiCallService.getReq(
        //       process.env.COMPANY_SERVER_API_URL + 'getFramework', { companyId: getCompany.company_id, type: 'ALL', user_type_code: 'company' }, {},
        //     )).data.map((obj) => obj.id);

        //     const queryParam = {
        //       company_id: getCompany.company_id,
        //       user_type_code: 'COMPANY',
        //       framework_ids: frameworkIds,
        //       qIds: undefined,
        //     };

        //     const getSectorQuestion = await this.externalApiCallService.getReq(
        //       process.env.COMPANY_SERVER_API_URL + 'getTriggerQuestion',
        //       queryParam,
        //       {},
        //     );

        //     let mainQuestions = getSectorQuestion.data;
        //     const filteredData = mainQuestions.filter(item => {
        //       try {
        //         // Parse the formula into an array
        //         const formulas = JSON.parse(item.formula);
        //         // Flatten the array and check if the target ID (substring) exists
        //         return formulas.flat().some(entry => entry.includes(32));
        //       } catch (e) {
        //         console.error("Invalid formula format", e);
        //         return false;
        //       }
        //     });


        //     for (let i = 0; i < userOrgChart.length; i++) {
        //       if (userOrgChart[i]?.userId) {
        //         const eventName = `notification${userOrgChart[i]?.userId}`;
        //         const loc = `${location['area']}, ${location['city']}, ${location['state']}, ${location['country']} - ${location['zipCode']}`;
        //         const massage = `${questionTitle} by your company at location: ${{ loc }} Exceeded Value: ${Number(targetValueDta?.targetData) - Number(readingValue)} kl`;
        //         this.socketService.sendNotificationToUser(String(userOrgChart[i]?.userId), eventName, massage);
        //         await this.userDaoService.insertNewNotification(new UserNotificationEntity(massage, [questionId], Number(userOrgChart[i]?.userId), systemUserId));
        //         const getUserDetails = await this.userDaoService.getCompanyDetailsBasedOnUserId(userOrgChart[i]?.userId);
        //         const userInformation = {
        //           name: getUserDetails?.first_name + ' ' + getUserDetails?.last_name,
        //           email: getUserDetails?.email,
        //           location: loc,
        //           title: questionTitle,
        //           actualValue: Number(readingValue),
        //           targetValue: Number(targetValueDta?.targetData),
        //         };
        //         if (targetValueDta && Number(targetValueDta?.targetData) < Number(readingValue)) {
        //           await this.sendMailService.sendingMail(
        //             userInformation,
        //             '/../../../public/views/templates/exceed-point.html',
        //             'Welcome to RIU',
        //             url,
        //             Number(readingValue) - Number(targetValueDta?.targetData)
        //           );
        //         }
        //       }
        //     }
        //   }
        // }
        await this.dashboardDaoService.insertTodaysActivityData(new TodaysActivity(questionTitle, "Answered", systemUserId, questionId));

        // ✅ If sublocation created, calculate parent SUM
        if (subLocationId && questionType === 'tabular_question') {
          await this.updateParentSumForReportingAnswer(financialYearId, questionId, sourceId, fromDate, toDate, systemUserId, moduleId, notApplicable, proofDocument, proofDocumentNote, note, companyId, questionnaireType, status, questionType as QuestionType);
        }
      }
    }

    if (frequency === "CUSTOM") {
      const queryParamForGraphMapping = {
        company_id: companyId,
        user_type_code: 'COMPANY',
        frameworkId: frameworkIds,
      };

      const getGraphQuestionMapping = await this.externalApiCallService.getReq(
        process.env.COMPANY_SERVER_API_URL + 'graph/mapping',
        queryParamForGraphMapping,
        {},
      );

      type FinancialYear = { id: number; financial_year_value: string };
      const { data: financialYears }: { data: FinancialYear[] } = await this.externalApiCallService.getReq(
        `${process.env.COMPANY_SERVER_API_URL}getFinancialYear`,
        { userId: companyId, type: 'COMPANY' },
        {},
      );

      const mainData = getGraphQuestionMapping.data;
      const filteredMainData = mainData.filter(
        (rec) => Number(rec.question_id) === Number(questionId),
      );
      const allSavedData = await this.aiDashboardDaoService.getAllSavedDashboardData();


      for (const item of filteredMainData) {
        const match = item.sub_question_id.match(/R(\d+)C(\d+)/);
        const qId = Number(item.sub_question_id.match(/Q(\d+)/)?.[1] || 0);
        if (notApplicable) continue;

        const financialYearValue =
          financialYears.find((fy) => fy.id == financialYearId)?.financial_year_value || "Not Found";

        if (typeof answer !== "string") continue;

        try {
          const parsedAnswer = JSON.parse(answer);

          let value = 0;
          let unit = 'NA';
          let row;
          let col;

          if (match) {
            row = parseInt(match[1], 10);
            col = parseInt(match[2], 10);
            value = parsedAnswer[row - 1]?.[col - 1] ?? 0;
            if (item.module === 'Waste')
              unit = 'MT';
            else if (item.module === 'Diversity' || item.module === 'Health & Safety' || item.module === 'Training')
              unit = 'Number';
            else if (item.module === 'Water') {
              unit = 'KL';
              value = isNaN(Number(value)) ? value : value / 1000;
            }
            else
              unit = parsedAnswer[row - 1]?.[col] ?? 'NA';
          }
          else {
            value = parsedAnswer.readingValue ?? 0;
            unit = parsedAnswer.unit ?? 'KG';
          }

          const period = this.getPeriodCode(fromDate, toDate, financialYearValue, company.starting_month);
          const displayPeriods = this.getDisplayPeriod(fromDate, toDate);

          const baseData = {
            questionId: qId,
            subQuestionId: item.sub_question_id,
            module: item.module,
            category: item.category,
            subCategory: item.sub_category,
            kpi: item.kpi,
            fromDate: fromDate,
            toDate: toDate,
            period,
            displayPeriods,
            locationId: sourceId || 1,
            sublocationId: subLocationId,
            financialYear: financialYearValue,
            status: 1,
          };

          const alreadyExists = allSavedData.find((saved) =>
            saved.questionId == qId &&
            saved.subQuestionId == item.sub_question_id &&
            saved.locationId == sourceId &&
            saved.fromDate == fromDate &&
            saved.toDate == toDate &&
            saved.category == item.category &&
            saved.module == item.module
          );

          if (alreadyExists) continue;

          if (qId !== 452 && qId !== 451 && item.category === 'Energy Consumption') {
            const fuel = this.fuelData.find((f) => f.questionId === qId);
            const emissionsData = this.calculateEnergy(answer, fuel);
            const energyData = {
              ...baseData,
              value: String(Number(emissionsData).toFixed(2)),
              unit: 'GJ',
            };
            await this.aiDashboardDaoService.saveData(energyData);
          } else if (item.category === 'Energy Consumption') {
            const enrrgyData = await this.getEmissionCalculation(parsedAnswer, qId)
            const energyValues = enrrgyData[row - 1][col - 1];
            const energyData = {
              ...baseData,
              value: String(Number(energyValues).toFixed(2)),
              unit: 'GJ',
            };

            await this.aiDashboardDaoService.saveData(energyData);
          } else if (qId !== 452 && qId !== 451 && item.category === 'Emission') {
            const fuel = this.fuelData.find((f) => f.questionId === qId);
            const emissionsData = this.calculateEmission(answer, fuel);
            const energyData = {
              ...baseData,
              value: String(Number(emissionsData).toFixed(2)),
              unit: 'tCo2',
            };
            await this.aiDashboardDaoService.saveData(energyData);
          } else if (item.category === 'Emission') {
            const enrrgyData = await this.getEmissionCalculation(parsedAnswer, qId)
            const energyValues = enrrgyData[row - 1][col];
            const energyData = {
              ...baseData,
              value: String(Number(energyValues).toFixed(2)),
              unit: 'tCo2',
            };
            await this.aiDashboardDaoService.saveData(energyData);
          } else if (item.category !== 'Energy Consumption' || item.category !== 'Emission') {
            const normalData = {
              ...baseData,
              value: String(value),
              unit,
            };
            await this.aiDashboardDaoService.saveData(normalData);
          }

        } catch (err) {
          console.error(`Error parsing answer for questionId ${qId}:`, err);
        }

      }
    }

    const actionText = isUpdate ? 'updated' : 'submitted';

    const activityLog = UserActivityLog.createLog(
      `Answer ${actionText} - ${questionTitle}`,
      'Question Answer',
      'success',
      systemUserId,
      questionId,
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
    this.computationReportingQuestionAnswer(questionId, questionType, financialYearId);
    throw new HttpException({
      status: 200,
      message: 'Answer Saved',
      notShowPopUp: req.body.viaEmissionData ? true : false,
      answers: answer
    }, HttpStatus.OK);

    // throw new HttpException({ status: 200, message: 'Answer Saved', req.body.viaEmissionData ? notShowPopUp: true : notShowPopUp: false, answers: answer }, HttpStatus.OK);
  }

  private calculateEnergy(dataArray: any, fuel: any) {
    let answer = dataArray;
    if (typeof answer === "string") {
      try {
        answer = JSON.parse(answer);
      } catch (error) {
        return 0
      }
    }
    if (answer && answer.readingValue) {
      const readingValue = parseFloat(answer.readingValue);
      const emission = (readingValue * fuel.density * fuel.calorificValue) / 1000;
      return emission
    }
  }

  private calculateEmission(dataArray: any, fuel: any) {
    let answer = dataArray;
    if (typeof answer === "string") {
      try {
        answer = JSON.parse(answer);
      } catch (error) {
        return 0
      }
    }
    if (answer && answer.readingValue) {
      const readingValue = parseFloat(answer.readingValue);
      const emission = (readingValue * fuel.emissionFactor) / 1000
      return emission
    }
  }

  private async getEmissionCalculation(value: any, questionId: number) {

    if (Number(questionId) === 452) {
      const tmpData = value.map(([value, unit], index) => {
        let energy = 0; // in GJ
        let emissions = 0; // in tCO2

        // Convert input to numeric
        const numericValue = parseFloat(value);

        if (isNaN(numericValue) || numericValue === 0 || !unit) {
          // Skip invalid or zero values
          return [0.0, 0.0];
        }

        // Normalize unit string
        const normalizedUnit = unit.trim().toLowerCase();

        // ---- Electricity ----
        if (['kilowatt-hours (kwh)', 'kwh'].includes(normalizedUnit)) {
          energy = (numericValue * 3.6) / 1000; // kWh → GJ
          emissions = (numericValue * 0.727) / 1000; // kg CO2 → tCO2
        } else if (['megawatt-hours (mwh)', 'mwh'].includes(normalizedUnit)) {
          const kWh = numericValue * 1000;
          energy = (kWh * 3.6) / 1000;
          emissions = (kWh * 0.727) / 1000;
        } else if (['gigawatt-hours (gwh)', 'gwh'].includes(normalizedUnit)) {
          const kWh = numericValue * 1_000_000;
          energy = (kWh * 3.6) / 1000;
          emissions = (kWh * 0.727) / 1000;
        }

        // ---- Diesel / Fuel Oil (index 2 only) ----
        else if (index === 2) {
          let massKg = 0;

          if (normalizedUnit === 'liters' || normalizedUnit === 'liter') {
            massKg = numericValue * 0.845; // liters → kg
          } else if (normalizedUnit === 'gallons') {
            const liters = numericValue * 3.785; // US gallon → liters
            massKg = liters * 0.845;
          } else if (normalizedUnit === 'metric tons') {
            massKg = numericValue * 1000; // 1 t → 1000 kg
          }

          if (massKg > 0) {
            energy = (massKg * 42.25) / 1000; // MJ/kg → GJ
            emissions =
              (energy * 74100 +
                energy * 10 * 27.9 +
                energy * 273 * 0.6) /
              1_000_000; // tCO2
          }
        }

        // ---- LPG (index 5 only) ----
        else if (index === 5) {
          let massKg = 0;

          if (normalizedUnit === 'cubic meters (m³)' || normalizedUnit === 'm³') {
            massKg = numericValue * 2.01; // m³ → kg
          } else if (normalizedUnit === 'kilograms (kg)' || normalizedUnit === 'kg') {
            massKg = numericValue * 0.54;
          } else if (normalizedUnit === 'metric tons') {
            massKg = numericValue * 1000;
          }

          if (massKg > 0) {
            energy = (massKg * 46.1) / 1000; // MJ/kg → GJ
            emissions =
              (energy * 63100 +
                energy * 5 * 27.9 +
                energy * 273 * 0.1) /
              1_000_000; // tCO2
          }
        }

        // Replace the original array values with energy and emissions
        return [
          energy.toFixed(2), // Energy in GJ
          emissions.toFixed(2), // Emission in tCO2
        ];
      });

      return tmpData;

    }

    if (Number(questionId) === 451) {

      const tmpData = value.map(([unit, value], index) => {
        let energy = 0; // in GJ
        let emissions = 0; // in tCO2

        // Convert input to numeric
        const numericValue = parseFloat(value);

        if (isNaN(numericValue) || numericValue === 0 || !unit) {
          // Skip invalid or zero values
          return [0.0, 0.0];
        }

        if (unit === 'KWH') {
          // Grid Electricity
          energy = (numericValue * 3.6) / 1000; // Convert kWh to GJ
          emissions = 0; // Convert kg CO2 to tCO2
        }

        // Replace the original array values with energy and emissions
        return [
          energy.toFixed(2), // Energy in GJ
          emissions.toFixed(2), // Emission in tCO2
        ];
      });
      return tmpData;
    }

  }

  private deduceType(fromDateStr: string, toDateStr: string): number {
    const fromDate = new Date(fromDateStr);
    const toDate = new Date(toDateStr);
    const fromYear = fromDate.getFullYear();
    const fromMonth = fromDate.getMonth();
    const toYear = toDate.getFullYear();
    const toMonth = toDate.getMonth();
    return (toYear - fromYear) * 12 + (toMonth - fromMonth);
  }

  private getPeriodCode(
    fromDateStr: string,
    toDateStr: string,
    financialYear: string,
    startingMonth: number,
  ): string {
    const type = this.deduceType(fromDateStr, toDateStr);
    const [fyStartYearStr] = financialYear.split('-');
    const fyStartYear = parseInt(fyStartYearStr, 10);
    const [fromYearStr, fromMonthStr] = fromDateStr.split('-');
    const fromYear = parseInt(fromYearStr, 10);
    const fromMonth = parseInt(fromMonthStr, 10);

    let monthOffset = (fromYear - fyStartYear) * 12 + (fromMonth - startingMonth);
    if (monthOffset < 0) monthOffset += 12;

    if (type === 1) return `M${(monthOffset % 12) + 1}`;
    if (type === 3) return `Q${Math.floor(monthOffset / 3) + 1}`;
    if (type === 6) return `H${Math.floor(monthOffset / 6) + 1}`;
    if (type === 12) return 'FY';

    return '';
  }

  private getDisplayPeriod(fromDateStr: string, toDateStr: string): string {
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];

    const fromDate = new Date(fromDateStr);
    const toDate = new Date(toDateStr);
    const fromMonth = fromDate.getMonth();

    let endMonthIndex: number;
    if (toDate.getDate() === 1) {
      endMonthIndex = (toDate.getMonth() - 1 + 12) % 12;
    } else {
      endMonthIndex = toDate.getMonth();
    }

    if (this.deduceType(fromDateStr, toDateStr) === 12) {
      return 'Apr–Mar';
    }

    if (fromMonth === endMonthIndex) {
      return `${monthNames[fromMonth]}`;
    } else {
      return `${monthNames[fromMonth]}–${monthNames[endMonthIndex]}`;
    }
  }

  async saveAnswerReportingQuestions(saveAnswerReportingQuestionDto: SaveAnswerReportingQuestionDto, req: any) {
    const systemUserId = req.headers.userid;

    const { financialYearId, questionId, questionType, answer, sourceId, fromDate, toDate, notApplicable, proofDocument, proofDocumentNote, note, frequency, moduleId, questionTitle, readingValue, subLocationId } = saveAnswerReportingQuestionDto;
    const parentId = ((await this.subUserDaoService.getSubUserBasedOnCompanyId(Number(systemUserId)))?.parentId);
    const company = await this.userDaoService.getHeadOfficeCompanyDetails(true);
    const companyId = (await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId)).company_id;
    if (!sourceId) {
      throw new HttpException({ status: 400, message: 'No Location found!' }, HttpStatus.CONFLICT);

    }
    const questionnaireType: QuestionnaireType = 'CA' as QuestionnaireType;
    const status: QuestionStatus = 'ANSWERED' as QuestionStatus;
    let frameworkIds = (await this.externalApiCallService.getReq(
      process.env.COMPANY_SERVER_API_URL + 'getFramework',
      { companyId: companyId, type: 'ALL', user_type_code: 'company' },
      {},
    )).data.map((obj) => obj.id)

    const assignedDetails = await this.sectorQuestionDaoModuleService.getAssignDetailsBasedOnQuestionIdAndAssignedToId(systemUserId, questionId, financialYearId);
    const assignedByUserDetails = await this.userDaoService.getCompanyDetailsBasedOnUserId(assignedDetails?.assignedBy);
    const auditorId = !parentId ? assignedByUserDetails.id : parentId;

    if (frequency === "ONE_TIME") {
      const existingRecord = await this.reportingModuleDaoService.getExistingRecordForOneTime(financialYearId, questionId, sourceId);
      if (existingRecord) {
        const historyEntity = this.createReportingAnswerHistoryEntity(existingRecord);
        await this.reportingModuleDaoService.saveReportingQuestionHistoryAnswer(historyEntity);
        const answerEntity = this.createReportingAnswerEntity(systemUserId, financialYearId, questionId, sourceId, subLocationId, moduleId, fromDate, toDate, notApplicable, answer, proofDocument, proofDocumentNote, note, questionType as QuestionType, companyId, questionnaireType, status);
        await this.reportingModuleDaoService.updateReportingQuestionAnswerForOneTime(questionId, financialYearId, answerEntity);
        await this.auditListingDaoService.updateAuditorId(existingRecord.id, auditorId);
        // await this.processDaoService.updateDeletable(trends["process"]);
      } else if (existingRecord === null) {
        const answerEntity = this.createReportingAnswerEntity(systemUserId, financialYearId, questionId, sourceId, subLocationId, moduleId, fromDate, toDate, notApplicable, answer, proofDocument, proofDocumentNote, note, questionType as QuestionType, companyId, questionnaireType, status);
        const insertAnswer = await this.reportingModuleDaoService.saveReportingQuestionAnswer(answerEntity);
        await this.auditListingDaoService.insertAuditData(new AuditListingEntity(
          questionType as QuestionType, companyId, financialYearId, questionId, questionnaireType, insertAnswer.id, auditorId, [auditorId, assignedDetails?.assignedBy, systemUserId], status));
        // const massage = `${item?.title}`
        // await this.dashboardDaoService.insertTodaysActivityData(new TodaysActivity(massage, "Answered", systemUserId, item.questionId));
      }
    } else if (frequency === "EVERY_FY") {
      const existingRecord = await this.reportingModuleDaoService.getExistingRecordForEveryFY(questionId, sourceId, financialYearId);
      if (existingRecord) {
        const historyEntity = this.createReportingAnswerHistoryEntity(existingRecord);
        await this.reportingModuleDaoService.saveReportingQuestionHistoryAnswer(historyEntity);
        const answerEntity = this.createReportingAnswerEntity(systemUserId, financialYearId, questionId, sourceId, subLocationId, moduleId, fromDate, toDate, notApplicable, answer, proofDocument, proofDocumentNote, note, questionType as QuestionType, companyId, questionnaireType, status);
        await this.reportingModuleDaoService.updateReportingQuestionAnswerForEveryFY(questionId, financialYearId, answerEntity);
        await this.auditListingDaoService.updateAuditorId(existingRecord.id, auditorId);
      } else if (existingRecord === null) {
        const answerEntity = this.createReportingAnswerEntity(systemUserId, financialYearId, questionId, sourceId, subLocationId, moduleId, fromDate, toDate, notApplicable, answer, proofDocument, proofDocumentNote, note, questionType as QuestionType, companyId, questionnaireType, status);
        const insertAnswer = await this.reportingModuleDaoService.saveReportingQuestionAnswer(answerEntity);
        await this.auditListingDaoService.insertAuditData(new AuditListingEntity(questionType as QuestionType, companyId, financialYearId, questionId, questionnaireType, insertAnswer.id, auditorId, [auditorId, assignedDetails?.assignedBy, systemUserId], status));
        // const massage = `${item?.title}`
        // await this.dashboardDaoService.insertTodaysActivityData(new TodaysActivity(massage, "Answered", systemUserId, item.questionId));
      }
    } else if (frequency === "CUSTOM") {
      const existingRecord = subLocationId ? await this.reportingModuleDaoService.getExistingRecordForCustoms(questionId, sourceId, financialYearId, fromDate, toDate, subLocationId) : await this.reportingModuleDaoService.getExistingRecordForCustom(questionId, sourceId, financialYearId, fromDate, toDate);
      if (existingRecord) {
        const historyEntity = this.createReportingAnswerHistoryEntity(existingRecord);
        await this.reportingModuleDaoService.saveReportingQuestionHistoryAnswer(historyEntity);
        const answerEntity = this.createReportingAnswerEntity(systemUserId, financialYearId, questionId, sourceId, subLocationId, moduleId, fromDate, toDate, notApplicable, answer, proofDocument, proofDocumentNote, note, questionType as QuestionType, companyId, questionnaireType, status);
        subLocationId ? await this.reportingModuleDaoService.updateReportingQuestionAnswerForSubForCustom(questionId, financialYearId, sourceId, subLocationId, fromDate, toDate, answerEntity) : await this.reportingModuleDaoService.updateReportingQuestionAnswerForCustom(questionId, financialYearId, sourceId, fromDate, toDate, answerEntity);

        // await this.reportingModuleDaoService.updateReportingQuestionAnswerForCustom(questionId, financialYearId, sourceId, fromDate, toDate, answerEntity);
        const targetValueDta = await this.setTargetDataQuestionDaoService.getExistingTergetValue(questionId, sourceId, fromDate, toDate);

        await this.dashboardDaoService.insertTodaysActivityData(new TodaysActivity(questionTitle, "Updated", systemUserId, questionId));
        await this.auditListingDaoService.updateAuditorId(existingRecord.id, auditorId);

      } else if (existingRecord === null) {
        const answerEntity = this.createReportingAnswerEntity(systemUserId, financialYearId, questionId, sourceId, subLocationId, moduleId, fromDate, toDate, notApplicable, answer, proofDocument, proofDocumentNote, note, questionType as QuestionType, companyId, questionnaireType, status);
        const insertAnswer = await this.reportingModuleDaoService.saveReportingQuestionAnswer(answerEntity);
        await this.auditListingDaoService.insertAuditData(new AuditListingEntity(questionType as QuestionType, companyId, financialYearId, questionId, questionnaireType, insertAnswer.id, auditorId, [auditorId, assignedDetails?.assignedBy, systemUserId], status));
        const targetValueDta = await this.setTargetDataQuestionDaoService.getExistingTergetValue(questionId, sourceId, fromDate, toDate);

        await this.dashboardDaoService.insertTodaysActivityData(new TodaysActivity(questionTitle, "Answered", systemUserId, questionId));
      }
    }
    if (frequency === "CUSTOM") {
      const queryParamForGraphMapping = {
        company_id: companyId,
        user_type_code: 'COMPANY',
        frameworkId: frameworkIds,
      };

      const getGraphQuestionMapping = await this.externalApiCallService.getReq(
        process.env.COMPANY_SERVER_API_URL + 'graph/mapping',
        queryParamForGraphMapping,
        {},
      );

      type FinancialYear = { id: number; financial_year_value: string };
      const { data: financialYears }: { data: FinancialYear[] } = await this.externalApiCallService.getReq(
        `${process.env.COMPANY_SERVER_API_URL}getFinancialYear`,
        { userId: companyId, type: 'COMPANY' },
        {},
      );

      const mainData = getGraphQuestionMapping.data;
      const filteredMainData = mainData.filter(
        (rec) => Number(rec.question_id) === Number(questionId),
      );
      const allSavedData = await this.aiDashboardDaoService.getAllSavedDashboardData();


      for (const item of filteredMainData) {
        const match = item.sub_question_id.match(/R(\d+)C(\d+)/);
        const qId = Number(item.sub_question_id.match(/Q(\d+)/)?.[1] || 0);
        if (notApplicable) continue;

        const financialYearValue =
          financialYears.find((fy) => fy.id == financialYearId)?.financial_year_value || "Not Found";

        if (typeof answer !== "string") continue;

        try {
          const parsedAnswer = JSON.parse(answer);

          let value = 0;
          let unit = 'NA';
          let row;
          let col;

          if (match) {
            row = parseInt(match[1], 10);
            col = parseInt(match[2], 10);
            value = parsedAnswer[row - 1]?.[col - 1] ?? 0;
            if (item.module === 'Waste')
              unit = 'MT';
            else if (item.module === 'Diversity' || item.module === 'Health & Safety' || item.module === 'Training')
              unit = 'Number';
            else if (item.module === 'Water' && item.catagory === 'Discharge')
              unit = 'KL';
            else
              unit = parsedAnswer[row - 1]?.[col] ?? 'NA';
          }
          else {
            value = parsedAnswer.readingValue ?? 0;
            unit = parsedAnswer.unit ?? 'KG';
          }

          const period = this.getPeriodCode(fromDate, toDate, financialYearValue, company.starting_month);
          const displayPeriods = this.getDisplayPeriod(fromDate, toDate);

          const baseData = {
            questionId: qId,
            subQuestionId: item.sub_question_id,
            module: item.module,
            category: item.category,
            subCategory: item.sub_category,
            kpi: item.kpi,
            fromDate: fromDate,
            toDate: toDate,
            period,
            displayPeriods,
            locationId: sourceId || 1,
            sublocationId: subLocationId,
            financialYear: financialYearValue,
            status: 1,
          };

          const alreadyExists = allSavedData.find((saved) =>
            saved.questionId == qId &&
            saved.subQuestionId == item.sub_question_id &&
            saved.locationId == sourceId &&
            saved.fromDate == fromDate &&
            saved.toDate == toDate &&
            saved.category == item.category &&
            saved.module == item.module
          );

          if (alreadyExists) continue;

          if (qId !== 452 && qId !== 451 && item.category === 'Energy Consumption') {
            const fuel = this.fuelData.find((f) => f.questionId === qId);
            const emissionsData = this.calculateEnergy(answer, fuel);
            const energyData = {
              ...baseData,
              value: String(Number(emissionsData).toFixed(2)),
              unit: 'GJ',
            };
            await this.aiDashboardDaoService.saveData(energyData);
          } else if (item.category === 'Energy Consumption') {
            const enrrgyData = await this.getEmissionCalculation(parsedAnswer, qId)
            const energyValues = enrrgyData[row - 1][col - 1];
            const energyData = {
              ...baseData,
              value: String(Number(energyValues).toFixed(2)),
              unit: 'GJ',
            };

            await this.aiDashboardDaoService.saveData(energyData);
          } else if (qId !== 452 && qId !== 451 && item.category === 'Emission') {
            const fuel = this.fuelData.find((f) => f.questionId === qId);
            const emissionsData = this.calculateEmission(answer, fuel);
            const energyData = {
              ...baseData,
              value: String(Number(emissionsData).toFixed(2)),
              unit: 'tCo2',
            };
            await this.aiDashboardDaoService.saveData(energyData);
          } else if (item.category === 'Emission') {
            const enrrgyData = await this.getEmissionCalculation(parsedAnswer, qId)
            const energyValues = enrrgyData[row - 1][col];
            const energyData = {
              ...baseData,
              value: String(Number(energyValues).toFixed(2)),
              unit: 'tCo2',
            };
            await this.aiDashboardDaoService.saveData(energyData);
          } else if (item.category !== 'Energy Consumption' || item.category !== 'Energy Consumption') {
            const normalData = {
              ...baseData,
              value: String(value),
              unit,
            };
            await this.aiDashboardDaoService.saveData(normalData);
          }

        } catch (err) {
          console.error(`Error parsing answer for questionId ${qId}:`, err);
        }

      }
    }
    this.computationReportingQuestionAnswer(questionId, questionType, financialYearId);
    throw new HttpException({ status: 200, message: 'Answer Saved', answers: [], notShowPopUp: true, }, HttpStatus.OK);
  }

  async getReportingQuestionAnswer(req: any) {
    const { moduleId, financialYearId } = req.query;
    if (!moduleId) {
      throw new HttpException({ status: 400, message: 'Module not found', answers: [] }, HttpStatus.CONFLICT);
    }
    const reportingAnswer = await this.reportingModuleDaoService.getReportingQuestionAnswer(JSON.parse(moduleId), Number(financialYearId));
    throw new HttpException({ status: 200, message: 'Data Found', answers: reportingAnswer }, HttpStatus.OK);
  }

  async dueDateRequestOverrideBulk(dto: SaveReportingDueDateBulkRequestDto, req: any) {
    const systemUserId = req.headers.userid;
    const now = new Date();
    const items = dto.overrideRequests;

    // Run everything in a transaction
    return await this.dataSource.transaction(async (manager) => {
      // Step 1: Get repository bound to this transaction
      const repo = manager.getRepository(ReportingDueDateOverrideEntity);

      // Step 2: Fetch all existing records in one go (composite keys)
      const existingRecords = await repo.find({
        where: items.map((item) => ({
          financialYearId: item.financialYearId,
          questionId: item.questionId,
          sourceId: item.sourceId,
          fromDate: item.fromDate,
          toDate: item.toDate,
        })),
      });

      // Step 3: Prepare merged entities
      const entities = items.map((item) => {
        const existing = existingRecords.find(
          (rec) =>
            rec.financialYearId === item.financialYearId &&
            rec.questionId === item.questionId &&
            rec.sourceId === item.sourceId &&
            rec.fromDate === item.fromDate &&
            rec.toDate === item.toDate,
        );

        if (existing) {
          return {
            ...existing,
            userId: systemUserId,
            status: ReportingApprovalStatus.PENDING,
            requestDate: now,
            updatedAt: now,
          };
        }

        return new ReportingDueDateOverrideEntity({
          userId: systemUserId,
          financialYearId: item.financialYearId,
          questionId: item.questionId,
          sourceId: item.sourceId,
          fromDate: item.fromDate,
          toDate: item.toDate,
          dueDateTime: null,
          approverId: null,
          approvalDate: null,
          status: ReportingApprovalStatus.PENDING,
          requestDate: now,
        });
      });

      // Step 4: Single save inside transaction
      await repo.save(entities);

      // Step 5: Return final response
      return {
        success: true,
        message: `Due Date Overrides processed successfully (${entities.length} records)`,
      };
    });
  }

  async dueDateRequestOverrideApprove(dto: SaveReportingDueDateApproveDto, req: any) {
    const systemUserId = req.headers.userid;
    const { ids, increasedDays } = dto;
    const getCompany = await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId);

    if (getCompany?.parent_id) {
      throw new HttpException('Operation not permitted', HttpStatus.FORBIDDEN);
    }

    return await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(ReportingDueDateOverrideEntity);

      // Fetch all matching records in one query
      const existingRequests = await repo.find({ where: { id: In(ids) } });

      if (!existingRequests.length) {
        return {
          success: false,
          message: 'No matching override requests found.',
          results: [],
        };
      }

      const now = new Date();
      const results = [];

      // Prepare all updates
      for (const request of existingRequests) {
        try {
          if (increasedDays) {
            const currentDueDate = new Date();
            currentDueDate.setDate(currentDueDate.getDate() + increasedDays);
            request.dueDateTime = currentDueDate;
          }

          request.approvalDate = now;
          request.approverId = systemUserId;
          request.status = ReportingApprovalStatus.APPROVED;
          request.updatedAt = now;

          results.push({ id: request.id, success: true });
        } catch (err) {
          results.push({ id: request.id, success: false, message: err.message });
        }
      }

      // Save all approved requests in bulk
      await repo.save(existingRequests);

      return {
        success: true,
        message: `${existingRequests.length} Due Date Override(s) approved successfully`,
        results,
      };
    });
  }

  async getDueDateOverridesByFinancialYear(financialYearId: number, req: any) {
    const systemUserId = req.headers.userid;

    const overrides = await this.reportingModuleDaoService.getDueDateOverridesByFinancialYear(financialYearId);
    const getCompany = await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId);

    const frameworkIds = (await this.externalApiCallService.getReq(
      process.env.COMPANY_SERVER_API_URL + 'getFramework',
      { companyId: getCompany.company_id, type: 'ALL', user_type_code: 'company' },
      {},
    )).data.map((obj) => obj.id)


    const queryParam = {
      company_id: getCompany.company_id,
      user_type_code: 'COMPANY',
      framework_ids: frameworkIds,
      qIds: undefined,
    };

    // 1. Fetch all questions
    const getReportingQuestion = await this.externalApiCallService.getReq(
      process.env.COMPANY_SERVER_API_URL + 'getReportingQuestion',
      queryParam,
      {},
    );

    // 2. Create a map of { questionId: title }
    const questionMap = {};
    if (getReportingQuestion?.data) {
      getReportingQuestion.data.forEach(q => {
        questionMap[q.questionId] = q.title; // adjust key if API returns different field names
      });
    }

    // 3. Transform overrides with questionTitle
    const transformedData = overrides
      .filter(override => getCompany?.parent_id ? override.userId == systemUserId : true)
      .map(override => ({
        id: override.id,
        userId: override.userId,
        userName: override.user
          ? `${override.user.first_name || ''} ${override.user.last_name || ''}`.trim()
          : null,
        financialYearId: override.financialYearId,
        questionId: override.questionId,
        questionTitle: questionMap[override.questionId] || null,  // ✅ Added title here
        sourceId: override.sourceId,
        location: override.source ? override.source.unitCode : null,
        fromDate: override.fromDate,
        toDate: override.toDate,
        requestDate: override.requestDate,
        dueDateTime: override.dueDateTime,
        approverId: override.approverId,
        approverName: override.approver
          ? `${override.approver.first_name || ''} ${override.approver.last_name || ''}`.trim()
          : null,
        approvalDate: override.approvalDate,
        status: override.status,
        createdAt: override.createdAt,
        updatedAt: override.updatedAt,
      }));

    return {
      success: true,
      message: 'Due Date Overrides fetched successfully',
      data: transformedData,
    };
  }

  // async getReportingQuestionAnswerBasedFinancialYear(req: any) {
  //   const { financialYearId } = req.query;
  //   const reportingAnswer = await this.reportingModuleDaoService.getReportingQuestionAnswerBasedFinancialYear(Number(financialYearId));
  //   throw new HttpException({ status: 200, message: 'Data Found', answers: reportingAnswer }, HttpStatus.OK);
  // }
  async getReportingQuestionAnswerBasedFinancialYear(req: any) {
    const { financialYearId } = req.query;
    const companyDetails = await this.userDaoService.getHeadOfficeCompanyDetails(true);

    if (!companyDetails.company_id) {
      throw new HttpException({ status: 404, message: 'Company not found', answers: [] }, HttpStatus.CONFLICT);
    }

    const framework_ids = await this.superAdminClientService.getFrameworkIds(companyDetails.company_id);
    const reportingQuestionsMap = (await this.superAdminClientService.getReportingQuestions(companyDetails.company_id, framework_ids)).reduce((acc, item) => {
      acc[`${item.questionId}`] = item;
      return acc;
    }, {});

    let allAnswers: any[] = [];

    // Define all question IDs that need special processing
    const specialQuestionIds = [527, 528, 529, 530, 190, 191, 236, 75];

    // Define question mappings
    const questionMapping: Record<number, number> = {
      422: 289,
      421: 293,
      423: 294,
      424: 295,
      449: 292,
      496: 495,
      498: 497,
      500: 499,
      425: 468,
      427: 426,

      553: 512,
      554: 513,
      555: 514,
      556: 515,
      557: 516,
      558: 517,
      564: 523,
      565: 523,
      566: 526,
      559: 518,
      560: 519,
      561: 520,
      562: 521,
      563: 522,
      590: 589
    };

    const energyQuestionMapping: Record<number, number> = {
      532: 289,
      534: 293,
      535: 294,
      536: 295,
      533: 292,
      542: 495,
      543: 497,
      544: 499,
      541: 468,
      537: 426,
      538: 428,
      539: 429,
      540: 430,
    };

    // Process each special question by calling getReportingAnswer
    for (const questionId of specialQuestionIds) {
      try {
        // Create a modified request object with the specific questionId
        const modifiedReq = {
          ...req,
          query: {
            ...req.query,
            questionId: questionId
          }
        };

        // Call getReportingAnswer for this specific question
        await this.getReportingAnswer(modifiedReq);

      } catch (exception) {
        // HttpExceptions are thrown in getReportingAnswer, extract the answers
        if (exception.response && exception.response.answers) {
          allAnswers = [...allAnswers, ...exception.response.answers];
        }
      }
    }

    // Process energy/fuel mapping questions
    try {
      // Process fuel emission questions
      for (const [questionId, mappedQuestionId] of Object.entries(questionMapping)) {
        try {
          const modifiedReq = {
            ...req,
            query: {
              ...req.query,
              questionId: questionId
            }
          };

          await this.getReportingAnswer(modifiedReq);

        } catch (exception) {
          if (exception.response && exception.response.answers) {
            allAnswers = [...allAnswers, ...exception.response.answers];
          }
        }
      }

      // Process energy questions
      for (const [questionId, mappedQuestionId] of Object.entries(energyQuestionMapping)) {
        try {
          const modifiedReq = {
            ...req,
            query: {
              ...req.query,
              questionId: questionId
            }
          };

          await this.getReportingAnswer(modifiedReq);

        } catch (exception) {
          if (exception.response && exception.response.answers) {
            allAnswers = [...allAnswers, ...exception.response.answers];
          }
        }
      }
    } catch (error) {
      console.error("Error processing energy/fuel mapping questions:", error);
    }

    // Get regular reporting answers (for questions not handled above)
    try {
      const regularAnswers = await this.reportingModuleDaoService.getReportingQuestionAnswerBasedFinancialYear(Number(financialYearId));

      let groupedAnswers: Record<string, Record<string, Record<number, any>>> = {};

      for (const item of regularAnswers) {
        const locationKey = item.subLocationId
          ? `${item.sourceId}_${item.subLocationId}`
          : `${item.sourceId}`;

        const periodKey = `${item.fromDate}_${item.toDate}`;

        if (!groupedAnswers[locationKey]) groupedAnswers[locationKey] = {};
        if (!groupedAnswers[locationKey][periodKey]) groupedAnswers[locationKey][periodKey] = {};

        groupedAnswers[locationKey][periodKey][item.questionId] = item;
      }

      const formulaQuestions = Object.values(reportingQuestionsMap).filter(q => q['isFormulaBased'] && q['formula']);

      // Run all formula calculations in parallel
      const formulaBasedAnswers = (await Promise.all(
        formulaQuestions.map(q =>
          this.calculateFormulaResult(
            companyDetails,
            q,
            financialYearId,
            reportingQuestionsMap,
            groupedAnswers
          )
        )
      )).flat();

      // Filter out answers for questions that we've already processed
      const processedQuestionIds = new Set([
        ...specialQuestionIds,
        ...Object.keys(questionMapping).map(Number),
        ...Object.keys(energyQuestionMapping).map(Number)
      ]);

      const filteredRegularAnswers = regularAnswers.filter(answer =>
        !processedQuestionIds.has(answer.questionId)
      );

      allAnswers = [...allAnswers, ...filteredRegularAnswers, ...formulaBasedAnswers];
    } catch (error) {
      console.error("Error getting regular reporting answers:", error);
    }

    throw new HttpException({ status: 200, message: 'Data Found', answers: allAnswers }, HttpStatus.OK);
  }

  async getReportingAnswer(req: any) {
    const { financialYearId, questionId } = req.query;

    if (!questionId) {
      throw new HttpException({ status: 400, message: 'Question is required', answers: [] }, HttpStatus.CONFLICT);
    }

    const getCompany = await this.userDaoService.getHeadOfficeCompanyDetails(true);

    if (!getCompany.company_id) {
      throw new HttpException({ status: 404, message: 'Company not found', answers: [] }, HttpStatus.CONFLICT);
    }

    const framework_ids = await this.superAdminClientService.getFrameworkIds(getCompany.company_id);
    const reportingQuestionsMap = (await this.superAdminClientService.getReportingQuestions(getCompany.company_id, framework_ids)).reduce((acc, item) => {
      acc[`${item.questionId}`] = item;
      return acc;
    }, {});


    const reportingQuesiton = reportingQuestionsMap[questionId];

    if (!reportingQuesiton) {
      throw new HttpException({ status: 400, message: 'Question not found', answers: [] }, HttpStatus.CONFLICT);
    }

    if (reportingQuesiton.isFormulaBased && reportingQuesiton.formula &&
      (![392, 431].includes(Number(reportingQuesiton.questionId)) || financialYearId !== 30)) {
      const results = await this.calculateFormulaResult(getCompany, reportingQuesiton, financialYearId, reportingQuestionsMap);
      throw new HttpException({ status: 200, message: 'Data Found', answers: results }, HttpStatus.OK);
    }

    if (Number(questionId) === 527) {
      const reportingAnswer = await this.reportingModuleDaoService.getReportingQuestionAnswers([391, 469, 474], Number(financialYearId));

      const groupedData = reportingAnswer.reduce((acc, item) => {
        if ([391, 469, 474].includes(item.questionId)) {
          const key = item.subLocationId ? `${item.fromDate}_${item.toDate}_${item.sourceId}_${item.subLocationId}` : `${item.fromDate}_${item.toDate}_${item.sourceId}`;

          let readingValue = 0;
          let parsedAnswer = {};
          if (item.notApplicable) { }
          else {
            if (item.answer) {
              try {
                parsedAnswer = JSON.parse(item.answer);
                readingValue = parsedAnswer['readingValue'] || 0;
              } catch (error) {
                console.error("Invalid JSON found:", item.answer, error);
                return acc;
              }
            }

            if (!acc[key]) {
              acc[key] = { ...item, questionId: 527 };
              acc[key].answer = JSON.stringify({
                ...parsedAnswer,
                questionId: 527,
                readingValue: 0,
              });
            }

            const answerObj = JSON.parse(acc[key].answer);
            answerObj.readingValue += isNaN(Number(readingValue)) ? 0 : Number(readingValue);
            acc[key].answer = JSON.stringify(answerObj);
          }
        }
        return acc;
      }, {});

      throw new HttpException({ status: 200, message: 'Data Found', answers: Object.values(groupedData) }, HttpStatus.OK);
    }

    if (Number(questionId) === 528) {
      const reportingAnswer = await this.reportingModuleDaoService.getReportingQuestionAnswers([426, 428, 429, 430, 468], Number(financialYearId));

      const groupedData = reportingAnswer.reduce((acc, item) => {
        if ([426, 428, 429, 430, 468].includes(item.questionId)) {
          const key = item.subLocationId ? `${item.fromDate}_${item.toDate}_${item.sourceId}_${item.subLocationId}` : `${item.fromDate}_${item.toDate}_${item.sourceId}`;

          let readingValue = 0;
          let parsedAnswer = {};
          if (item.notApplicable) { } else {
            if (item.answer) {
              try {
                parsedAnswer = JSON.parse(item.answer);
                readingValue = parsedAnswer['readingValue'] || 0;
              } catch (error) {
                console.error("Invalid JSON found:", item.answer, error);
                return acc;
              }
            }

            if (!acc[key]) {
              acc[key] = { ...item, questionId: 528 };
              acc[key].answer = JSON.stringify({
                ...parsedAnswer,
                questionId: 528,
                readingValue: 0,
              });
            }

            const answerObj = JSON.parse(acc[key].answer);
            answerObj.readingValue += isNaN(Number(readingValue)) ? 0 : Number(readingValue);
            acc[key].answer = JSON.stringify(answerObj);
          }
        }
        return acc;
      }, {});

      throw new HttpException({ status: 200, message: 'Data Found', answers: Object.values(groupedData) }, HttpStatus.OK);
    }

    if (Number(questionId) === 529) {
      const questionMapping: Record<number, number> = {
        422: 289,
        421: 293,
        423: 294,
        424: 295,
        449: 292,
        496: 495,
        498: 497,
        500: 499,
      };

      const reportingAnswers = await this.reportingModuleDaoService.getReportingQuestionAnswers(Object.values(questionMapping), Number(financialYearId));

      let reportingAnswer = [];
      const mappedQuestions = Object.entries(questionMapping);
      for (const [originalQuestionId, mappedQuestionId] of mappedQuestions) {
        const fuel = this.fuelData.find(f => f.questionId === Number(originalQuestionId));
        const tmpans = reportingAnswers.filter((data) => data.questionId == mappedQuestionId)
        if (fuel) {
          const emissionsData = this.calculateEmissions(tmpans, fuel, Number(originalQuestionId), 'EMISSION');
          reportingAnswer = [...reportingAnswer, ...emissionsData];
        }
      }
      const groupedData = reportingAnswer.reduce((acc, item) => {
        const key = item.subLocationId ? `${item.fromDate}_${item.toDate}_${item.sourceId}_${item.subLocationId}` : `${item.fromDate}_${item.toDate}_${item.sourceId}`;

        let readingValue = 0;
        let parsedAnswer = {};

        if (!item.notApplicable) {
          if (item.answer) {
            try {
              parsedAnswer = JSON.parse(item.answer);
              readingValue = parsedAnswer['readingValue'] || 0;
            } catch (error) {
              console.error("Invalid JSON found:", item.answer, error);
              return acc;
            }
          }

          if (!acc[key]) {
            acc[key] = { ...item, questionId: 529 };
            acc[key].answer = JSON.stringify({
              ...parsedAnswer,
              questionId: 529,
              readingValue: 0,
            });
          }

          const answerObj = JSON.parse(acc[key].answer);
          const numericValue = isNaN(Number(readingValue)) ? 0 : Number(Number(readingValue).toFixed(2));
          answerObj.readingValue = Number((answerObj.readingValue + numericValue).toFixed(2));
          acc[key].answer = JSON.stringify(answerObj);
        }

        return acc;
      }, {});

      throw new HttpException({ status: 200, message: 'Data Found', answers: Object.values(groupedData) }, HttpStatus.OK);
    }

    if (Number(questionId) === 530) {
      const questionMapping: Record<number, number> = {
        425: 468,
        427: 426
      };

      const reportingAnswers = await this.reportingModuleDaoService.getReportingQuestionAnswers(Object.values(questionMapping), Number(financialYearId));

      let reportingAnswer = [];
      const mappedQuestions = Object.entries(questionMapping);
      for (const [originalQuestionId, mappedQuestionId] of mappedQuestions) {
        const fuel = this.fuelData.find(f => f.questionId === Number(originalQuestionId));
        const tmpans = reportingAnswers.filter((data) => data.questionId == mappedQuestionId)
        if (fuel) {
          const emissionsData = this.calculateEmissions(tmpans, fuel, Number(originalQuestionId), 'EMISSION');
          reportingAnswer = [...reportingAnswer, ...emissionsData];
        }
      }
      const groupedData = reportingAnswer.reduce((acc, item) => {
        const key = item.subLocationId ? `${item.fromDate}_${item.toDate}_${item.sourceId}_${item.subLocationId}` : `${item.fromDate}_${item.toDate}_${item.sourceId}`;

        let readingValue = 0;
        let parsedAnswer = {};

        if (!item.notApplicable) {
          if (item.answer) {
            try {
              parsedAnswer = JSON.parse(item.answer);
              readingValue = parsedAnswer['readingValue'] || 0;
            } catch (error) {
              console.error("Invalid JSON found:", item.answer, error);
              return acc;
            }
          }

          if (!acc[key]) {
            acc[key] = { ...item, questionId: 530 };
            acc[key].answer = JSON.stringify({
              ...parsedAnswer,
              questionId: 530,
              readingValue: 0,
            });
          }

          const answerObj = JSON.parse(acc[key].answer);
          const numericValue = isNaN(Number(readingValue)) ? 0 : Number(Number(readingValue).toFixed(2));
          answerObj.readingValue = Number((answerObj.readingValue + numericValue).toFixed(2));
          acc[key].answer = JSON.stringify(answerObj);
        }

        return acc;
      }, {});

      throw new HttpException({ status: 200, message: 'Data Found', answers: Object.values(groupedData) }, HttpStatus.OK);
    }

    let finalAnswer: any[] = []; // Initialize as array

    // Rest of the method for other question IDs
    const questionMapping: Record<number, number> = {
      422: 289,
      421: 293,
      423: 294,
      424: 295,
      449: 292,
      496: 495,
      498: 497,
      500: 499,
      425: 468,
      427: 426,

      553: 512,
      554: 513,
      555: 514,
      556: 515,
      557: 516,
      558: 517,
      564: 523,
      565: 523,
      566: 526,
      559: 518,
      560: 519,
      561: 520,
      562: 521,
      563: 522,
      590: 589
    };

    const energyQuestionMapping: Record<number, number> = {
      532: 289,
      534: 293,
      535: 294,
      536: 295,
      533: 292,
      542: 495,
      543: 497,
      544: 499,
      541: 468,
      537: 426,
      538: 428,
      539: 429,
      540: 430,
    };

    if (energyQuestionMapping[Number(questionId)]) {
      const reportingAnswer = await this.reportingModuleDaoService.getReportingAnswer(
        energyQuestionMapping[Number(questionId)],
        Number(financialYearId)
      );
      const fuel = this.energyData.find(f => f.questionId === Number(questionId));
      finalAnswer = this.calculateEmissions(reportingAnswer, fuel, Number(questionId), 'ENERGY');
    } else if (questionMapping[Number(questionId)]) {
      const reportingAnswer = await this.reportingModuleDaoService.getReportingAnswer(
        questionMapping[Number(questionId)],
        Number(financialYearId)
      );
      const fuel = this.fuelData.find(f => f.questionId === Number(questionId));
      finalAnswer = this.calculateEmissions(reportingAnswer, fuel, Number(questionId), 'EMISSION');
    } else if ((Number(questionId) === 452)) {

      // finalAnswer = await this.reportingModuleDaoService.getReportingAnswer(Number(questionId), Number(financialYearId));
      let data = await this.reportingModuleDaoService.getReportingAnswer(
        Number(questionId),
        Number(financialYearId)
      );

      // Ensure array
      let finalAnswer = Array.isArray(data) ? data : [data];

      // Fetch unit configs
      const unitList = await this.unitDaoService.getAllUnit();

      // RowIndex → categoryId mapping
      const unitMap = {
        0: 2,
        1: 3,
        2: 3,
        3: 5,
        4: 3,
        5: 3,
        6: 5,
        7: 5,
        8: 5,
        9: 5,
        10: 5,
        11: 5,
        12: 5,
      };

      // Loop & process each record
      finalAnswer.forEach(record => {
        if (!record.answer) return;

        // Parse answer
        let parsedAnswer;
        try {
          parsedAnswer = JSON.parse(record.answer);
        } catch {
          parsedAnswer = [];
        }

        // Update units in place
        parsedAnswer.forEach((row, idx) => {
          const catId = unitMap[idx];
          if (catId) {
            const matched = unitList.find(u => u.catagoryId === catId);
            if (matched) {
              row[1] = matched.unit;
            }
          }
        });

        record.answer = JSON.stringify(parsedAnswer);
      });

      finalAnswer = await this.getAnswerHistory(finalAnswer, questionId, financialYearId);
      finalAnswer = await this.getAnswerAuditRemarks(finalAnswer, questionId, financialYearId);

      throw new HttpException({ status: 200, message: 'Data Found', answers: finalAnswer }, HttpStatus.OK);

    } else if ((Number(questionId) === 42342)) {

      // finalAnswer = await this.reportingModuleDaoService.getReportingAnswer(Number(questionId), Number(financialYearId));
      let data = await this.reportingModuleDaoService.getReportingAnswer(
        Number(questionId),
        Number(financialYearId)
      );

      // Ensure array
      let finalAnswer = Array.isArray(data) ? data : [data];

      // Fetch unit configs
      const unitList = await this.unitDaoService.getAllUnit();

      // RowIndex → categoryId mapping
      const unitMap = {
        0: 2, // electricity
        1: 5, // liquid fuel
        2: 5,
        3: 6, // solid fuel
        4: 7, // gas
        5: 5,
        // ... extend mapping
      };

      // Loop & process each record
      finalAnswer.forEach(record => {
        if (!record.answer) return;

        // Parse answer
        let parsedAnswer;
        try {
          parsedAnswer = JSON.parse(record.answer);
        } catch {
          parsedAnswer = [];
        }

        // Update units in place
        parsedAnswer.forEach((row, idx) => {
          const catId = unitMap[idx];
          if (catId) {
            const matched = unitList.find(u => u.categoryId === catId);
            if (matched) {
              row[1] = matched.defaultUnit;
            }
          }
        });

        // Assign back
        record.answer = JSON.stringify(parsedAnswer);
      });



    } else {
      finalAnswer = await this.reportingModuleDaoService.getReportingAnswer(Number(questionId), Number(financialYearId));
    }

    finalAnswer = await this.getAnswerHistory(finalAnswer, questionId, financialYearId);
    finalAnswer = await this.getAnswerAuditRemarks(finalAnswer, questionId, financialYearId);

    throw new HttpException({ status: 200, message: 'Data Found', answers: finalAnswer }, HttpStatus.OK);
  }

  private async getAnswerHistory(answers, questionId, financialYearId) {
    const historyAnswer = await this.reportingModuleDaoService.getReportingHistoryAnswer(Number(questionId), Number(financialYearId));
    for (const answer of answers) {
      const matchingHistory = historyAnswer.filter(history =>
        history.questionId === answer.questionId &&
        history.sourceId === answer.sourceId &&
        history.subLocationId === answer.subLocationId &&
        history.fromDate === answer.fromDate &&
        history.toDate === answer.toDate
      );

      answer.historyAnswer = matchingHistory;
    }

    return answers;
  }

  private async getAnswerAuditRemarks(answers, questionId, financialYearId) {
    const auditHistory = await this.auditListingDaoService.getAuditHistoryForQuestionId(Number(questionId), Number(financialYearId));
    const uniqueAuditorIds = auditHistory.flatMap(history => (history?.remark ?? []).map(remark => Number(remark.id)));
    const userDetails = (await this.userDaoService.getUserDetails(uniqueAuditorIds)).reduce((acc, user) => {
      const { id, ...rest } = user;
      acc[user.id] = rest;
      return acc;
    }, {});

    for (const answer of answers) {
      const filteredAuditHistory = auditHistory.find(history =>
        history.answerId == answer.id
      );

      answer.auditorRemarks = (filteredAuditHistory?.remark ?? []).map(remark => {
        return {
          ...remark,
          id: Number(remark.id),
          ...(userDetails?.[Number(remark.id)] ?? {})
        }
      });
    }

    return answers;
  }

  private calculateEmissions(dataArray: any[], fuel: any, questionId: number, type: any) {
    return dataArray.map(item => {
      let answer = item.answer;


      // Parse if it's a string
      if (typeof answer === "string") {
        try {
          answer = JSON.parse(answer);
        } catch (error) {
          // console.error("JSON parsing error:", error, "for item:", item);
          return { ...item, questionId }; // Return item unchanged if parsing fails
        }
      }

      if (answer && answer.readingValue) {
        const readingValue = parseFloat(answer.readingValue); // kg or liters
        // const emission = type === 'ENERGY' ?   (readingValue * fuel.density * fuel.calorificValue) / 1000:((readingValue * fuel.density * fuel.calorificValue * fuel.emissionFactor) / 1000)/1000; // Convert to tCO₂
        const emission = type === 'ENERGY' ? (readingValue * fuel.density * fuel.calorificValue) / 1000 : (readingValue * fuel.emissionFactor) / 1000; // Convert to tCO₂

        return {
          ...item,
          questionId,
          answer: JSON.stringify({ ...answer, readingValue: emission.toFixed(2) }) // Correct syntax
        };
      }

      return { ...item, questionId }; // Default if no valid readingValue
    });
  }

  private energyData = [
    { fuelType: "Diesel", questionId: 532, density: 0.85, calorificValue: 42.5, emissionFactor: 2.66155 },
    { fuelType: "Petrol", questionId: 534, density: 0.74, calorificValue: 44.4, emissionFactor: 2.35372 },
    { fuelType: "CNG", questionId: 535, density: 0.72, calorificValue: 48.0, emissionFactor: 56.1 },
    { fuelType: "PNG", questionId: 536, density: 0.8, calorificValue: 39.0, emissionFactor: 2.04 },
    { fuelType: "LPG", questionId: 533, density: 0.54, calorificValue: 46.1, emissionFactor: 1.55713 },
    { fuelType: "Furnace Oil", questionId: 542, density: 0.95, calorificValue: 40.5, emissionFactor: 323.842 },
    { fuelType: "Coal", questionId: 543, density: 1.35, calorificValue: 25.0, emissionFactor: 2399.43994 },
    { fuelType: "Briquette", questionId: 544, density: 1.2, calorificValue: 18.0, emissionFactor: 460.24 },
    { fuelType: "Grid", questionId: 541, density: 1, calorificValue: 3.6, emissionFactor: 0.727 },
    { fuelType: "Captive", questionId: 537, density: 1, calorificValue: 3.6, emissionFactor: 0.727 },
    { fuelType: "Electricity Consumption through DG", questionId: 538, density: 3.6, calorificValue: 3.6, emissionFactor: 0.727 },
    { fuelType: "Electricity Consumption from Renewable Energy (via PPA)", questionId: 539, density: 3.6, calorificValue: 1, emissionFactor: 0.727 },
    { fuelType: "Electricity Consumption from Renewable Energy (Rooftop Solar)", questionId: 540, density: 3.6, calorificValue: 1, emissionFactor: 0.727 }
  ];

  private fuelData = [
    { fuelType: "Diesel", questionId: 422, density: 0.85, calorificValue: 42.5, emissionFactor: 2.66155 },
    { fuelType: "Petrol", questionId: 421, density: 0.74, calorificValue: 44.4, emissionFactor: 2.35372 },
    { fuelType: "CNG", questionId: 423, density: 0.72, calorificValue: 48.0, emissionFactor: 56.1 },
    { fuelType: "PNG", questionId: 424, density: 0.8, calorificValue: 39.0, emissionFactor: 2.04 },
    { fuelType: "LPG", questionId: 449, density: 0.54, calorificValue: 46.1, emissionFactor: 1.55713 },
    { fuelType: "Furnace Oil", questionId: 496, density: 0.95, calorificValue: 40.5, emissionFactor: 323.842 },
    { fuelType: "Coal", questionId: 498, density: 1.35, calorificValue: 25.0, emissionFactor: 2399.43994 },
    { fuelType: "Briquette", questionId: 500, density: 1.2, calorificValue: 18.0, emissionFactor: 460.24 },
    { fuelType: "Grid", questionId: 425, density: 1, calorificValue: 3.6, emissionFactor: 0.727 },
    { fuelType: "Captive", questionId: 427, density: 1, calorificValue: 3.6, emissionFactor: 0.727 },
    { fuelType: "Grid", questionId: 425, density: 1, calorificValue: 3.6, emissionFactor: 0.727 },
    { fuelType: "Captive", questionId: 427, density: 1, calorificValue: 3.6, emissionFactor: 0.727 },
    { fuelType: "Captive", questionId: 427, density: 1, calorificValue: 3.6, emissionFactor: 0.727 },

    { fuelType: "Nitrous oxide", questionId: 553, density: 1, calorificValue: 1, emissionFactor: 273 * 0.001977 },
    { fuelType: "Carbon dioxide", questionId: 554, density: 1, calorificValue: 1, emissionFactor: 1 },
    { fuelType: "Carbon dioxide", questionId: 590, density: 1, calorificValue: 1, emissionFactor: 1 },
    { fuelType: "Entonox", questionId: 555, density: 1, calorificValue: 1, emissionFactor: 273 },
    { fuelType: "Desflurane", questionId: 556, density: 1, calorificValue: 1, emissionFactor: 2540 * 0.001465 },
    { fuelType: "Isoflurane", questionId: 557, density: 1, calorificValue: 1, emissionFactor: 539 * 0.001502 },
    { fuelType: "Sevoflurane", questionId: 558, density: 1, calorificValue: 1, emissionFactor: 127 * 0.001520 },
    { fuelType: "Sevitrue", questionId: 564, density: 1, calorificValue: 1, emissionFactor: 127 * 0.001520 },
    { fuelType: "Suprane", questionId: 565, density: 1, calorificValue: 1, emissionFactor: 2540 * 0.001465 },
    { fuelType: "Sevorane", questionId: 566, density: 1, calorificValue: 1, emissionFactor: 127 * 0.001520 },
    { fuelType: "R-134A", questionId: 559, density: 1, calorificValue: 1, emissionFactor: 1530 },
    { fuelType: "R-22", questionId: 560, density: 1, calorificValue: 1, emissionFactor: 1760 },
    { fuelType: "R-407C", questionId: 561, density: 1, calorificValue: 1, emissionFactor: 1774 },
    { fuelType: "R-32", questionId: 562, density: 1, calorificValue: 1, emissionFactor: 771 },
    { fuelType: "R-410A", questionId: 563, density: 1, calorificValue: 1, emissionFactor: 2256 },
  ];

  async getReportingPreviousYearAnswer(req: any) {
    const { financialYearId, questionId } = req.query;
    if (!questionId) {
      throw new HttpException({ status: 400, message: 'Question not found', answers: [] }, HttpStatus.CONFLICT);
    }
    const reportingAnswer = await this.reportingModuleDaoService.getReportingAnswer(questionId, Number(financialYearId));
    throw new HttpException({ status: 200, message: 'Data Found', answers: reportingAnswer }, HttpStatus.OK);
  }

  private async computationReportingQuestionAnswer(questionId: any, questionType: any, financialYearId: Number) {
    const headCompany = await this.userDaoService.getHeadOfficeCompanyDetails(true);
    const getESGReport = await this.esgReportingDaoService.getEsgReportingBasedOnUserId(headCompany.id);
    const frameworkTopicKpi = JSON.parse(getESGReport[0]?.frameworkTopicKpi);
    const topicIds = [...(frameworkTopicKpi?.mandatoryTopicsId ?? []), ...(frameworkTopicKpi?.voluntaryTopicsId ?? []), ...(frameworkTopicKpi?.customTopicsId ?? [])];
    const queryParam = {
      companyId: headCompany.company_id,
      type: "CUSTOM",
      user_type_code: 'company',
      entity: 'company',
      framework_ids: frameworkTopicKpi?.frameworkId,
      topic_ids: topicIds,
      financial_year_id: financialYearId,
      questionnaire_type: "QA",
    };

    const getSectorQuestion = await this.externalApiCallService.getReq(
      process.env.COMPANY_SERVER_API_URL + 'getSectorQuestion',
      queryParam,
      {},
    );
    let mainQuestions = getSectorQuestion.data;

    const formulaObject = await this.filterByFormula(mainQuestions, questionId);

    for (const obj of formulaObject) {
      const questionnaireType: QuestionnaireType = 'CA' as QuestionnaireType;
      const status: QuestionStatus = 'ACCEPTED' as QuestionStatus;
      const idsArray = this.extractIdsFromFormula(obj.formula);

      type FinancialYear = { id: number; financial_year_value: string };

      const financialYearData: { data: FinancialYear[] } = await this.externalApiCallService.getReq(
        process.env.COMPANY_SERVER_API_URL + 'getFinancialYear',
        { userId: headCompany.company_id, type: 'COMPANY' },
        {},
      );

      const lastFinancialYear = this.getPreviousIdById(financialYearData.data, Number(financialYearId));
      let reportingAnswer = await this.reportingModuleDaoService.getReportingQuestionAnswerBasedId(Number(financialYearId), idsArray);
      let reportingPreviousYearAnswer = await this.reportingModuleDaoService.getReportingQuestionAnswerBasedId(Number(lastFinancialYear), idsArray);
      const lastToLastFinancialYear = this.getPreviousIdById(financialYearData.data, Number(lastFinancialYear));
      let reportingPreviousToPreviousYearAnswer = await this.reportingModuleDaoService.getReportingQuestionAnswerBasedId(Number(lastToLastFinancialYear), idsArray);

      const allIdsPresent = idsArray.every(id => reportingAnswer.some(answer => answer.questionId === id));
      if (obj.id === 100) {
        const currentYearData = await this.getEnergyAndEmission(Number(financialYearId))
        const lastYearData = await this.getEnergyAndEmission(Number(lastFinancialYear))

        function safeParseAnswer(data, qId) {
          const obj = data.find(item => item.questionId === qId);
          if (!obj || !obj.answer) return null; // no object or empty answer

          try {
            const parsed = JSON.parse(obj.answer);
            return parsed?.[0]?.[0] ?? null; // first row, first column
          } catch (e) {
            return null; // invalid JSON
          }
        }

        let currentYear = await this.reportingModuleDaoService.getReportingQuestionAnswerBasedId(
          Number(financialYearId),
          [455, 456]
        );
        let lastYear = await this.reportingModuleDaoService.getReportingQuestionAnswerBasedId(
          Number(lastFinancialYear),
          [455, 456]
        );

        const filteredRevenue455 = safeParseAnswer(currentYear, 455);
        const filteredRevenue456 = safeParseAnswer(currentYear, 456);
        const lastfilteredRevenue455 = safeParseAnswer(lastYear, 455);
        const lastfilteredRevenue456 = safeParseAnswer(lastYear, 456);
        const filtered451 = currentYearData.filter(item => item.questionId === 451);
        const filtered452 = currentYearData.filter(item => item.questionId === 452);
        const lastfiltered451 = lastYearData.filter(item => item.questionId === 451);
        const lastfiltered452 = lastYearData.filter(item => item.questionId === 452);

        function sumFor451(data) {
          let sumMain = 0;
          let sumOthers = 0;

          data.forEach(item => {
            item.energy.forEach((row, rowIndex) => {
              const val = parseFloat(row[0] || 0);
              if (isNaN(val)) return;

              if (rowIndex === 3 || rowIndex === 0) {
                sumMain += val;
              } else {
                sumOthers += val;
              }
            });
          });

          return { sumMain, sumOthers };
        }

        function sumFor452(data) {
          let sumMain = 0;
          let sumOthers = 0;

          data.forEach(item => {
            item.energy.forEach((row, rowIndex) => {
              const val = parseFloat(row[0] || 0);
              if (isNaN(val)) return;

              if (rowIndex === 0) {
                sumMain += val;
              } else {
                sumOthers += val;
              }
            });
          });

          return { sumMain, sumOthers };
        }
        const current451Sums = sumFor451(filtered451);
        const current452Sums = sumFor452(filtered452);
        const last451Sums = sumFor451(lastfiltered451);
        const last452Sums = sumFor452(lastfiltered452);

        const finalResult: string[][] = [];

        finalResult.push(["", ""]);
        finalResult.push([String(current451Sums.sumMain), String(last451Sums.sumMain)]);
        finalResult.push([String(current451Sums.sumOthers), String(last451Sums.sumOthers)]);
        finalResult.push(["0", "0"]);
        finalResult.push([String(current451Sums.sumMain + current451Sums.sumOthers), String(last451Sums.sumMain + last451Sums.sumOthers)]);
        finalResult.push(["", ""]);
        finalResult.push([String(current452Sums.sumMain), String(last452Sums.sumMain)]);
        finalResult.push([String(current452Sums.sumOthers), String(last452Sums.sumOthers)]);
        finalResult.push(["0", "0"]);
        finalResult.push([String(current452Sums.sumMain + current452Sums.sumOthers), String(last452Sums.sumMain + last452Sums.sumOthers)]);
        finalResult.push(["", ""]);
        finalResult.push([String(current452Sums.sumMain + current452Sums.sumOthers + current451Sums.sumMain + current451Sums.sumOthers), String(last452Sums.sumMain + last452Sums.sumOthers + last451Sums.sumMain + last451Sums.sumOthers)]);
        finalResult.push([String((current452Sums.sumMain + current452Sums.sumOthers + current451Sums.sumMain + current451Sums.sumOthers) / (filteredRevenue455 / 1000000)), String((last452Sums.sumMain + last452Sums.sumOthers + last451Sums.sumMain + last451Sums.sumOthers) / (lastfilteredRevenue455 / 1000000))]);
        finalResult.push([String((current452Sums.sumMain + current452Sums.sumOthers + current451Sums.sumMain + current451Sums.sumOthers) / (filteredRevenue456 / 1000000)), String((last452Sums.sumMain + last452Sums.sumOthers + last451Sums.sumMain + last451Sums.sumOthers) / (lastfilteredRevenue456 / 1000000))]);
        finalResult.push(["NA", "NA"]);
        finalResult.push(["NA", "NA"]);

        const questionnaireType: QuestionnaireType = 'CA' as QuestionnaireType;

        const status: QuestionStatus = 'ACCEPTED' as QuestionStatus
        const existingRecord = await this.sectorQuestionDaoModuleService.getExistingRecordTabularAnswer(100, 1, Number(financialYearId));
        if (existingRecord) {
          const historyEntity = this.createTabularHistoryEntity(existingRecord, questionnaireType);
          await this.sectorQuestionDaoModuleService.saveSectorQuestionTabularHistoryAnswer(historyEntity);
          const answerEntity = this.createEnergyTabularAnswerEntity(1, headCompany.company_id, Number(financialYearId), questionnaireType, status, finalResult, 100, null);
          await this.sectorQuestionDaoModuleService.updateSectorQuestionTabularAnswer(100, 1, Number(financialYearId), answerEntity);
        } else if (existingRecord === null) {
          const answerEntity = this.createEnergyTabularAnswerEntity(1, headCompany.company_id, Number(financialYearId), questionnaireType, status, finalResult, 100, null);
          await this.sectorQuestionDaoModuleService.saveSectorQuestionTabularAnswer(answerEntity);
        }
      }
      if (allIdsPresent) {
        if ((obj.questionType === "qualitative") || (obj.questionType === "quatitative")) {
          let { answer, proofDocument, note } = await this.calculateFinalAnswerForOtherType(reportingAnswer, obj.formula);
          const lastAnswer = reportingAnswer.length > 0 ? reportingAnswer[reportingAnswer.length - 1] : null;
          if (lastAnswer.notApplicable) {
            answer = "Not Applicable"
          }
          if ((obj.formula.includes('R') || obj.formula.includes('C'))) {
            answer = answer[0][0]
          }

          if (questionId === 13) {
            let parsedAnswer: string[] = [];

            try {
              parsedAnswer = JSON.parse(reportingAnswer[0].answer).flat();
            } catch (err) {
              console.error(err)
            }

            const tmpAnswer =
              parsedAnswer[2]?.trim() ||
              parsedAnswer[0]?.trim() ||
              parsedAnswer[1]?.trim() ||
              '';

            answer = tmpAnswer;
          }

          note = Array.isArray(note) && note.length > 0
            ? note
              .filter(n => typeof n === 'string' && n.trim() !== '')
              .join('\n\n')
            : '';

          const existingRecord = await this.sectorQuestionDaoModuleService.getExistingRecordAnswer(obj.id, Number(financialYearId));
          if (existingRecord) {
            const historyEntity = this.createAnswerHistoryEntity(existingRecord, questionnaireType);
            await this.sectorQuestionDaoModuleService.saveSectorQuestionHistoryAnswer(historyEntity);
            const answerEntity = this.createAnswerEntity(reportingAnswer[0]?.userId, obj, headCompany.company_id, questionnaireType, status, this.md.renderInline(answer), financialYearId,
              proofDocument, this.md.renderInline(note));
            await this.sectorQuestionDaoModuleService.updateSectorQuestionAnswer(obj.id, Number(financialYearId), answerEntity);
          } else if (existingRecord === null) {
            const answerEntity = this.createAnswerEntity(reportingAnswer[0]?.userId, obj, headCompany.company_id, questionnaireType, status, this.md.renderInline(answer), financialYearId,
              proofDocument, this.md.renderInline(note));
            await this.sectorQuestionDaoModuleService.saveSectorQuestionAnswer(answerEntity);
          }
        } if (obj.questionType === "yes_no") {
          let answer, proofDocument, noteArray
          const lastAnswer = reportingAnswer.length > 0 ? reportingAnswer[reportingAnswer.length - 1] : null;

          if (obj.id === 160) {
            if (lastAnswer.notApplicable) {
              answer = "Not Applicable"
            } else {
              const result = (obj.formula.includes('R') || obj.formula.includes('C')) && await this.calculateFinalAnswer(reportingAnswer, [[obj.formula]], reportingPreviousYearAnswer, reportingPreviousToPreviousYearAnswer, obj.id);
              answer = result.answer[0][0];
              proofDocument = result.proofDocument;
              noteArray = result.note;
            }
          } if (obj.id === 54) {
            if (lastAnswer.notApplicable) {
              answer = "Not Applicable"
            } else {
              answer = JSON.parse(lastAnswer.answer);
              answer = `${answer[0][0] || ''}, ${answer[0][0] === 'Yes' ? answer[0][1] || '' : answer[0][2] || ''}`;
              proofDocument = lastAnswer.proofDocument;
              noteArray = lastAnswer.note;
            }
          } else {

            if (lastAnswer.notApplicable) {
              answer = "Not Applicable";
            } else {
              answer = JSON.parse(lastAnswer.answer);

              if (obj.questionType === "yes_no") {
                if (answer.answer === 'No') {
                  answer = `${answer.answer}`
                } else {
                  let parts: string[] = [];

                  if (answer.answer) parts.push(answer.answer);

                  const q1Part = answer.Q1 || answer.percentage || answer.provideDetails;
                  if (q1Part !== undefined && q1Part !== null && q1Part !== "") {
                    parts.push(q1Part);
                  }

                  const q2Part = answer.Q2 || answer.weblink || answer.provideDetails;
                  if (q2Part !== undefined && q2Part !== null && q2Part !== "") {
                    parts.push(q2Part);
                  }

                  answer = parts.join(", ");
                }
              }
            }

            proofDocument = [...new Set(lastAnswer.proofDocument)].filter(doc => Object.keys(doc).length > 0);
            noteArray = Array.isArray(lastAnswer.note)
              ? [...new Set(lastAnswer.note.flat(Infinity)
                .filter((n) => typeof n === 'string' && n.trim() !== ''))]
              : [];
          }

          let note = noteArray.length > 0
            ? noteArray.filter(n => n.trim() !== '').join('\n\n')
            : '';

          const existingRecord = await this.sectorQuestionDaoModuleService.getExistingRecordAnswer(obj.id, Number(financialYearId));
          if (existingRecord) {
            const historyEntity = this.createAnswerHistoryEntity(existingRecord, questionnaireType);
            await this.sectorQuestionDaoModuleService.saveSectorQuestionHistoryAnswer(historyEntity);
            const answerEntity = this.createAnswerEntity(reportingAnswer[0]?.userId, obj, headCompany.company_id, questionnaireType, status, answer, financialYearId,
              proofDocument, this.md.renderInline(note));
            await this.sectorQuestionDaoModuleService.updateSectorQuestionAnswer(obj.id, Number(financialYearId), answerEntity);
          } else if (existingRecord === null) {
            const answerEntity = this.createAnswerEntity(reportingAnswer[0]?.userId, obj, headCompany.company_id, questionnaireType, status, answer, financialYearId,
              proofDocument, this.md.renderInline(note));
            await this.sectorQuestionDaoModuleService.saveSectorQuestionAnswer(answerEntity);
          }
        } else if (obj.questionType === "tabular_question") {
          let answer, proofDocument, note;
          if ((obj?.id === 20 || obj?.id === 21 || obj?.id === 63 || obj?.id === 64 || obj?.id === 1031 || obj.id === 1037 || obj.id === 66 || obj.id === 23 || obj.id === 86 || obj.id === 87) && reportingAnswer.length > 2) {
            type FinancialYear = { id: number; financial_year_value: string };
            const getCompany = await this.userDaoService.getHeadOfficeCompanyDetails(true);

            const financialYearData: { data: FinancialYear[] } = await this.externalApiCallService.getReq(
              process.env.COMPANY_SERVER_API_URL + 'getFinancialYear',
              { userId: getCompany.company_id, type: 'COMPANY' },
              {},
            );
            const financialYearValue = financialYearData.data.find(
              (fy: FinancialYear) => fy.id === Number(financialYearId)
            )?.financial_year_value || "Not Found";
            const lastFinancialYearValue = financialYearData.data.find(
              (fy: FinancialYear) => fy.id === Number(lastFinancialYear)
            )?.financial_year_value || "Not Found";
            // this.getTrainingData(getCompany.company_id,Number(financialYearId))

            const periods = await this.generatePeriods(getCompany?.frequency, getCompany?.starting_month, financialYearValue);
            const frequency = await this.answerFrequencyDaoService.getAnswerFrequency((Number(lastFinancialYear)));

            const lastYearperiods = await this.generatePeriods(frequency[0]?.frequency, getCompany?.starting_month, lastFinancialYearValue);

            const periodValues = Object.values(periods).reverse(); // Convert object to array of values
            const lastPeriodValues = Object.values(lastYearperiods).reverse(); // Convert object to array of values


            const uniqueQuestionIds = [...new Set(reportingAnswer.map(item => item.questionId))];

            const result = uniqueQuestionIds.map((qid) => {
              for (const period of periodValues) {
                const match = reportingAnswer.find(d => d.questionId === qid && d.fromDate === period);
                if (match) return match;
              }
              return null; // If not found in any period
            });

            const lastResult = uniqueQuestionIds.map((qid) => {
              for (const period of lastPeriodValues) {
                const match = reportingPreviousYearAnswer.find(d => d.questionId === qid && d.fromDate === period);
                if (match) return match;
              }
              return null; // If not found in any period
            });

            ({ answer, proofDocument, note } = await this.calculateFinalAnswer(
              result,
              JSON.parse(obj.formula),
              lastResult, reportingPreviousToPreviousYearAnswer,
              obj.id
            ));
          } else if (obj?.id === 25) {
            const last = reportingAnswer[reportingAnswer.length - 1];
            if (last.notApplicable) {
              answer = "Not Applicable";
            } else {
              let formula = JSON.parse(obj.formula);
              const tmpans = JSON.parse(last.answer);
              formula[0][0] = tmpans.answer;
              formula[1][0] = tmpans.Q1;
              formula[2][0] = tmpans.Q2;
              answer = formula
            }
            proofDocument = last.proofDocument;
            note = [...new Set(last.note.flat(Infinity).filter((n) => typeof n === 'string' && n.trim() !== ''))]

          } else if (obj?.id === 67) {

            let formula = JSON.parse(obj.formula);

            const findAndParseAnswer = (id: number) => {
              const raw = reportingAnswer.find(item => item.questionId === id)?.answer;
              return raw ? JSON.parse(raw) : {};
            };

            const foundObject202 = findAndParseAnswer(202);
            const foundObject203 = reportingAnswer.find(item => item.questionId === 203)?.answer;
            const foundObject204 = findAndParseAnswer(204);
            const foundObject205 = findAndParseAnswer(205);

            formula[0][0] = foundObject202.answer || '';
            formula[1][0] = foundObject202.provideDetails || '';
            formula[2][0] = foundObject203 || '';
            formula[3][0] = `${foundObject204.answer || ''}, ${foundObject204.Q1 || ''}`;
            formula[4][0] = `${foundObject205.answer || ''}, ${foundObject205.Q1 || ''}`;

            answer = formula;

            // Collect all proofDocuments and notes from reportingAnswer
            const allProofDocuments = reportingAnswer
              .flatMap(item => item.proofDocument)
              .filter(doc => Object.keys(doc).length > 0);

            const allNotes = [
              ...new Set(
                reportingAnswer
                  .map(item => item.note)
                  .flat(Infinity)
                  .filter(n => typeof n === 'string' && n.trim() !== '')
              )
            ];

            proofDocument = allProofDocuments;
            note = allNotes;

          } else {
            ({ answer, proofDocument, note } = await this.calculateFinalAnswer(
              reportingAnswer,
              JSON.parse(obj.formula),
              reportingPreviousYearAnswer, reportingPreviousToPreviousYearAnswer,
              obj.id
            ));
          }
          note = note
            .filter(n => n.trim() !== '')
            .join('\n\n');

          const existingRecord = await this.sectorQuestionDaoModuleService.getExistingRecordTabularAnswer(obj.id, 1, Number(financialYearId));
          if (existingRecord) {
            const historyEntity = this.createTabularHistoryEntity(existingRecord, questionnaireType);
            await this.sectorQuestionDaoModuleService.saveSectorQuestionTabularHistoryAnswer(historyEntity);
            const answerEntity = this.createTabularAnswerEntity(reportingAnswer[0]?.userId, obj, reportingAnswer[0], headCompany.company_id, Number(financialYearId), questionnaireType, status, answer, proofDocument, this.md.renderInline(note));
            await this.sectorQuestionDaoModuleService.updateSectorQuestionTabularAnswer(obj?.id, 1, Number(financialYearId), answerEntity);
          } else if (existingRecord === null) {
            const answerEntity = this.createTabularAnswerEntity(reportingAnswer[0]?.userId, obj, reportingAnswer[0], headCompany.company_id, Number(financialYearId), questionnaireType, status, answer, proofDocument, this.md.renderInline(note));
            await this.sectorQuestionDaoModuleService.saveSectorQuestionTabularAnswer(answerEntity);
          }
        } else if (obj.questionType === "quantitative_trends") {
          const tmpAnswer = await this.calculateFinalTrendsAnswer(reportingAnswer, obj.formula);
          const existingRecord = await this.sectorQuestionDaoModuleService.getExistingRecordTrendsAnswers(obj.id, Number(financialYearId));
          if (existingRecord) {
            // const historyEntity = this.createTrendsHistoryEntity(existingRecord, questionnaireType);
            // await this.sectorQuestionDaoModuleService.saveSectorQuestionTrendsHistoryAnswer(historyEntity);
            const answerEntity = this.createTrendsAnswerEntity(reportingAnswer[0]?.userId, obj, reportingAnswer[0], Number(financialYearId), headCompany.company_id, questionnaireType, status, tmpAnswer);
            await this.sectorQuestionDaoModuleService.updateSectorQuestionTrendsAnswers(obj?.id, Number(financialYearId), answerEntity);
          } else if (existingRecord === null) {
            const answerEntity = this.createTrendsAnswerEntity(reportingAnswer[0]?.userId, obj, reportingAnswer[0], Number(financialYearId), headCompany.company_id, questionnaireType, status, tmpAnswer);
            await this.sectorQuestionDaoModuleService.saveSectorQuestionTrendsAnswer(answerEntity);
          }
        }
      }
    }
  }

  private async getEnergyAndEmission(financialYearId: number) {
    const answerData = await this.sectorQuestionDaoModuleService.getReportingQuestionTabularAnswerBasedId(
      [452, 451],
      financialYearId
    );

    answerData.forEach((item) => {
      let tmpData: [string, string][] = [];

      // Safe parse with fallback empty array
      let parsedAnswer: ([string, string] | [number, number])[] = [];
      try {
        parsedAnswer = item.answer ? JSON.parse(item.answer) : [];
      } catch {
        parsedAnswer = [];
      }

      if (Number(item.questionId) === 452) {
        // Here parsedAnswer has format [value, unit]
        tmpData = parsedAnswer.map(([value, unit], index) => {
          const numericValue = parseFloat(String(value));
          if (isNaN(numericValue) || numericValue === 0 || !unit) {
            return ["0.00", "0.00"];
          }

          let energy = 0;
          let emissions = 0;

          if (unit === "KWH") {
            energy = (numericValue * 3.6) / 1000;
            emissions = (numericValue * 0.716) / 1000;
          } else if (index === 2) {
            const mass = numericValue * 845;
            energy = (mass * 43) / 1_000_000;
            emissions = (energy / 1000) * 74100 / 1000;
          } else if (index === 5) {
            energy = numericValue * 0.026; // MJ to GJ
            emissions = energy * 0.060; // kg CO2 to tCO2
          }

          return [energy.toFixed(2), emissions.toFixed(2)];
        });
      } else if (Number(item.questionId) === 451) {
        // Here parsedAnswer has format [unit, value]
        tmpData = parsedAnswer.map(([unit, value]) => {
          const numericValue = parseFloat(String(value));
          if (isNaN(numericValue) || numericValue === 0 || !unit) {
            return ["0.00", "0.00"];
          }

          let energy = 0;
          let emissions = 0;

          if (unit === "KWH") {
            energy = (numericValue * 3.6) / 1000;
            emissions = 0;
          }

          return [energy.toFixed(2), emissions.toFixed(2)];
        });
      }

      item.energy = tmpData;
    });

    return answerData;
  }

  private async filterByFormula(mainQuestions: any[], id: number): Promise<any[]> {
    try {
      return mainQuestions.filter(item => {
        if (typeof item.formula === 'string') {
          // Check if the formula string contains `Q${id}`
          return item.formula.includes(`Q${id}`) && !item.formula.match(`Q${id}[0-9]+`);
        } else if (Array.isArray(item.formula)) {
          // Check if any sub-item in the array contains `Q${id}`
          return item.formula.some(subItem => {
            if (Array.isArray(subItem)) {
              // Check if any sub-sub-item in nested arrays contains `Q${id}`
              return subItem.some(subSubItem => subSubItem.includes(`Q${id}`) && !subSubItem.match(`Q${id}[0-9]+`));
            } else {
              // Check if the sub-item string contains `Q${id}`
              return subItem.includes(`Q${id}`) && !subItem.match(`Q${id}[0-9]+`);
            }
          });
        }
        return false; // If formula is not a string or array, exclude it
      });
    } catch (error) {
      console.error('Error in filterByFormula:', error);
      throw error;
    }
  }

  private async calculateFinalAnswer(
    answers: any,
    formula: string[][],
    previousYearAnswers: any,
    previousToPreviousYearAnswers: any,
    qId
  ): Promise<any> {
    let collectedProofDocuments: string[] = [];
    let collectedNotes: string[] = [];

    const getValue = (
      questionId: number,
      row: number,
      col: number,
      sourceAnswers: any[],
      sourceType: 'current' | 'previous' | 'previousToPrevious'
    ): { value: string; proofDocument: any; note: any } => {
      const relevantAnswers = sourceAnswers.filter(a => a.questionId === questionId);
      if (relevantAnswers.length === 0) {
        return { value: '', proofDocument: null, note: null };
      }

      let sum = 0;
      let combinedString = '';
      let hasNonNumeric = false;
      let lastProofDocument = null;
      let lastNote = null;
      const seenTextValues = new Set<string>();

      relevantAnswers.forEach(answer => {
        let cellValue: any;

        if (answer.notApplicable) {
          cellValue = 'Not Applicable';
        } else {
          try {
            const parsedAnswer = JSON.parse(answer.answer);
            if (parsedAnswer[row]) {
              cellValue = parsedAnswer[row][col] || '';
            }
          } catch (error) {
            cellValue = '';
          }
        }

        lastProofDocument = answer.proofDocument;
        lastNote = answer.note;

        if (cellValue === '' || isNaN(cellValue)) {
          if (cellValue !== '' && !seenTextValues.has(cellValue)) {
            seenTextValues.add(cellValue);
            combinedString += cellValue + ' ';
          }
          hasNonNumeric = true;
        } else if (qId === 12) {
          sum = cellValue;
        } else {
          sum += parseFloat(cellValue);
        }
      });

      // ✅ only collect from current-year answers
      if (sourceType === 'current') {
        if (lastProofDocument && Array.isArray(lastProofDocument)) {
          // const flattened = lastProofDocument.flat() as unknown[];
          // const allDocs = [...new Set(flattened.filter((doc): doc is string => typeof doc === 'string'))];
          collectedProofDocuments.push(...(lastProofDocument));
        }

        if (lastNote && Array.isArray(lastNote)) {
          const flattened = lastNote.flat() as unknown[];
          const allDocs = [...new Set(flattened.filter((doc): doc is string => typeof doc === 'string'))];
          collectedNotes.push(...allDocs);
        }
      }

      return {
        value: hasNonNumeric
          ? combinedString.trim()
          : sum.toString(),
        proofDocument: lastProofDocument,
        note: lastNote
      };
    };


    const evaluatedFormula: any[][] = formula.map(row =>
      row.map(cell => {
        if (!cell) return '';

        const values: string[] = [];

        const replaced = cell.replace(/(?:FY\[-(\d+)\]_)?Q(\d+)R(\d+)C(\d+)/g, (_, offset, qId, r, c) => {
          const questionId = parseInt(qId);
          const rowIdx = parseInt(r) - 1;
          const colIdx = parseInt(c) - 1;

          let source: any[] = answers;
          if (offset === '1') {
            source = previousYearAnswers;
          } else if (offset === '2') {
            source = previousToPreviousYearAnswers;
          }

          const { value } = getValue(
            questionId,
            rowIdx,
            colIdx,
            source,
            offset === '1' ? 'previous' : offset === '2' ? 'previousToPrevious' : 'current'
          );


          values.push(value !== 'undefined' ? value : '');
          const finalValue = isNaN(Number(value)) ? (value !== 'undefined' ? `"${value}"` : '') : (value !== 'undefined' ? value : '');
          let check = this.isExpression(cell);

          return check ? finalValue === '' ? '0' : finalValue : finalValue;

        });

        try {
          const hasNonNumeric = values.some(val => isNaN(Number(val)));
          const hasNumeric = values.some(val => !isNaN(Number(val)));

          if (hasNonNumeric && hasNumeric) {
            return String(0);
          }

          if (hasNonNumeric && !hasNumeric) {
            const uniqueText = [...new Set(values.filter(v => typeof v === 'string'))];
            return this.md.renderInline(uniqueText.join(', '));
          }

          let result = eval(replaced);
          if (qId === 105 && !isNaN(result)) {
            result = Number(result) / 1000
          }

          const isPercentage = this.isPercentageFormula(cell);

          if ((result === Infinity || result === -Infinity || isNaN(result)) && (result !== undefined)) {
            if (isPercentage) {
              return `0%`;
            } else {
              return '0';
            }
          }


          const value = isNaN(result) ? result || '' : result;


          if (!isNaN(value)) {
            const num = parseFloat(value.toFixed(2));
            const formatted = Number.isInteger(num) ? num : num;

            if (isPercentage) {
              return `${formatted}%`;
            } else {
              return formatted;
            }
          } else {
            return value || '';
          }



        } catch {
          return String(replaced);
        }
      })
    );

    return {
      answer: evaluatedFormula,
      proofDocument: [...new Set(collectedProofDocuments)].filter(doc => Object.keys(doc).length > 0),
      note: [...new Set(collectedNotes.filter(n => n.trim() !== ''))],
    };
  }

  private isPercentageFormula(formula: string): boolean {
    return /\*100\b/.test(formula.replace(/\s+/g, ""));
  }

  private isExpression = (formula: string): boolean => {
    const cleaned = formula.replace(/^FY\[-?\d+\]_/, "");
    return /[+\-*/()]/.test(cleaned);
  };

  private getPreviousIdById(data: { id: number; financial_year_value: string }[], targetId: number): number | null {
    const index = data.findIndex(item => item.id === targetId);
    if (index > 0) {
      return data[index - 1].id;
    }
    return null;
  }

  private async calculateFinalAnswerForOtherType(answers: any, formula: string): Promise<any> {
    const proofDocuments: any[] = [];
    const notes: any[] = [];

    const getValue = (questionId: number): { answer: string, proofDocument: any, note: any } => {
      const filteredAnswers = answers.filter((a: any) => a.questionId === questionId);
      if (filteredAnswers.length === 0) {
        return { answer: '0', proofDocument: null, note: null };
      }
      const last = filteredAnswers[filteredAnswers.length - 1];
      return {
        answer: last.answer ?? '0',
        proofDocument: last.proofDocument,
        note: last.note
      };
    };

    const replacedFormula = formula.replace(/Q(\d+)/g, (_, qId) => {
      const result = getValue(parseInt(qId));

      if (result.proofDocument) proofDocuments.push(...result.proofDocument);
      if (result.note) notes.push(result.note);

      return isNaN(Number(result.answer)) ? `"${result.answer}"` : result.answer;
    });

    let evaluatedFormula: any;
    try {
      evaluatedFormula = eval(replacedFormula);
      if (isNaN(evaluatedFormula)) {
        evaluatedFormula = replacedFormula.replace(/"/g, '');
      } else {
        evaluatedFormula = parseFloat(evaluatedFormula.toFixed(2));
      }
    } catch (error) {
      evaluatedFormula = replacedFormula.replace(/"/g, '');
    }
    return {
      answer: evaluatedFormula,
      proofDocument: [...new Set(proofDocuments)].filter(doc => Object.keys(doc).length > 0),
      note: [...new Set(notes.flat(Infinity).filter((n) => typeof n === 'string' && n.trim() !== ''))],
    };
  }

  private async calculateFinalTrendsAnswer(answers: any, formula: string): Promise<any> {
    const getValue = (questionId: number): number => {
      const relevantAnswers = answers.filter((a: any) => a.questionId === questionId);
      if (relevantAnswers.length === 0) return 0;

      let sum = 0;

      relevantAnswers.forEach((answer: any) => {
        const parsedAnswer = JSON.parse(answer.answer);
        if (parsedAnswer && parsedAnswer.readingValue !== undefined) {
          const readingValue = parseFloat(parsedAnswer.readingValue);
          if (!isNaN(readingValue)) {
            sum += readingValue;
          }
        }
      });

      return sum;
    };

    const replacedFormula = formula.replace(/Q(\d+)/g, (_, qId) => {
      const value = getValue(parseInt(qId));
      return isNaN(Number(value)) ? `"${value}"` : value.toString();
    });

    let evaluatedFormula: any;
    try {
      evaluatedFormula = eval(replacedFormula);
      if (isNaN(evaluatedFormula)) {
        evaluatedFormula = replacedFormula.replace(/"/g, '');
      } else {
        evaluatedFormula = parseFloat(evaluatedFormula.toFixed(2));
      }
    } catch (error) {
      evaluatedFormula = replacedFormula.replace(/"/g, '');
    }

    return evaluatedFormula;
  }

  private extractIdsFromFormula(formula: string): number[] {
    const idsArray = new Set<number>();
    if (formula) {
      const matches = formula.match(/Q(\d+)/g);
      if (matches) {
        for (const match of matches) {
          const id = parseInt(match.substring(1), 10);
          if (!isNaN(id)) {
            idsArray.add(id);
          }
        }
      }
    }
    return [...idsArray];
  }

  private createReportingAnswerHistoryEntity(existingRecord: any): ReportingQuestionHistoryAnswerEntity {
    return new ReportingQuestionHistoryAnswerEntity(
      existingRecord.userId, existingRecord.financialYearId, existingRecord.questionId, existingRecord.sourceId, existingRecord.subLocationId, existingRecord.moduleId, existingRecord.fromDate, existingRecord.toDate,
      existingRecord.notApplicable, existingRecord.answer, existingRecord.createdAt, existingRecord.proofDocument, existingRecord.proofDocumentNote, existingRecord.status as QuestionStatus, existingRecord.note, existingRecord.questionType as QuestionType, existingRecord.companyId, existingRecord.questionnaireType);
  }

  private createReportingAnswerEntity(systemUserId: any, financialYearId: number, questionId: number, sourceId: number, subLocationId: number, moduleId: number, fromDate: string, toDate: string,
    notApplicable: boolean, answer: string, proofDocument: string[][], proofDocumentNote: string[][], note: string[][], questionType: QuestionType, companyId: any, questionnaireType: QuestionnaireType, status: QuestionStatus): ReportingQuestionAnswerEntity {
    return new ReportingQuestionAnswerEntity(
      systemUserId, financialYearId, questionId, sourceId, subLocationId, moduleId, fromDate, toDate, notApplicable, answer, proofDocument, proofDocumentNote, status, note, questionType as QuestionType, companyId, questionnaireType
    );
  }

  private createAnswerHistoryEntity(existingRecord: any, questionnaireType: QuestionnaireType): SectorQuestionHistoryAnswerEntity {
    return new SectorQuestionHistoryAnswerEntity(
      existingRecord.userId, existingRecord.financialYearId, existingRecord.frameworkId, existingRecord.topicId, existingRecord.kpiId, existingRecord.questionId,
      existingRecord.answer, existingRecord.notApplicable, existingRecord.sourceId, null, null, null, existingRecord.companyId, existingRecord.questionType as QuestionType,
      questionnaireType, existingRecord.updatedAt, existingRecord.status as QuestionStatus,
    );
  }

  private createTabularHistoryEntity(existingRecord: any, questionnaireType: QuestionnaireType): SectorQuestionTabularHistoryAnswerEntity {
    return new SectorQuestionTabularHistoryAnswerEntity(
      existingRecord.userId, existingRecord.financialYearId, existingRecord.frameworkId, existingRecord.topicId, existingRecord.kpiId, existingRecord.questionId,
      existingRecord.sourceId, existingRecord.questionType as QuestionType, existingRecord.answer, existingRecord.notApplicable, existingRecord.financialYearId, null, null, null, existingRecord.companyId,
      questionnaireType, existingRecord.updatedAt, existingRecord.status as QuestionStatus,
    );
  }

  private compareAndGetExceeds(arr1: any, arr2: any) {
    const result = [];

    arr1.forEach((row, i) => {
      row.forEach((value, j) => {
        if (arr2[i][j] > value) {
          const exceededValue = arr2[i][j] - value;
          result.push({
            index: [i, j],
            exceededValue: exceededValue
          });
        }
      });
    });

    return result;
  };

  private async updateParentSumForReportingAnswer(
    financialYearId: number,
    questionId: number,
    sourceId: number,
    fromDate: string,
    toDate: string,
    systemUserId: number,
    moduleId: number,
    notApplicable: boolean,
    proofDocument: string[][],
    proofDocumentNote: string[][],
    note: string[][],
    companyId: number,
    questionnaireType: QuestionnaireType,
    status: QuestionStatus,
    questionType: QuestionType
  ) {
    // Fetch all sublocation answers for this location
    const sublocations = await this.sourceDaoService.getSubLocationBySourceId(sourceId);
    if (!sublocations || sublocations.length === 0) {
      return; // No sublocations, nothing to do
    }

    const subLocationIds = sublocations.map(sub => sub.id);

    // Fetch all sublocation answers
    const allSubLocationAnswers = await this.reportingModuleDaoService.getReportingQuestionAnswers([questionId], financialYearId);
    const relevantAnswers = allSubLocationAnswers.filter(
      ans => ans.sourceId === sourceId &&
             ans.financialYearId === financialYearId &&
             ans.fromDate === fromDate &&
             ans.toDate === toDate &&
             ans.subLocationId !== null &&
             ans.subLocationId !== undefined &&
             subLocationIds.includes(ans.subLocationId)
    );

    if (relevantAnswers.length === 0) {
      return; // No sublocation data to sum
    }

    // Calculate SUM of all sublocation answers (tabular question with arrays)
    let summedAnswer: number[][] | null = null;

    for (const subAnswer of relevantAnswers) {
      if (!subAnswer.answer) continue;

      const parsedAnswer = JSON.parse(subAnswer.answer);
      if (!Array.isArray(parsedAnswer) || parsedAnswer.length === 0) continue;

      if (!summedAnswer) {
        // Initialize with first answer structure
        summedAnswer = parsedAnswer.map(row => row.map(val => {
          const num = parseFloat(val);
          return isNaN(num) ? 0 : num;
        }));
      } else {
        // Add subsequent answers
        parsedAnswer.forEach((row, i) => {
          if (summedAnswer![i]) {
            row.forEach((val, j) => {
              const num = parseFloat(val);
              if (!isNaN(num)) {
                summedAnswer![i][j] += num;
              }
            });
          }
        });
      }
    }

    if (!summedAnswer) {
      return; // Could not calculate sum
    }

    // Check if parent record exists
    const parentRecord = await this.reportingModuleDaoService.getExistingRecordForCustom(
      questionId,
      sourceId,
      financialYearId,
      fromDate,
      toDate
    );

    const parentAnswerString = JSON.stringify(summedAnswer);
    const parentEntity = this.createReportingAnswerEntity(
      systemUserId,
      financialYearId,
      questionId,
      sourceId,
      null, // Parent has null subLocationId
      moduleId,
      fromDate,
      toDate,
      notApplicable,
      parentAnswerString,
      proofDocument,
      proofDocumentNote,
      note,
      questionType,
      companyId,
      questionnaireType,
      status
    );

    if (parentRecord) {
      // Update existing parent record
      await this.reportingModuleDaoService.updateReportingQuestionAnswerForCustom(
        questionId,
        financialYearId,
        sourceId,
        fromDate,
        toDate,
        parentEntity
      );
      console.log(`✅ Parent SUM updated for location ${sourceId}, question ${questionId}`);
    } else {
      // Create new parent record
      await this.reportingModuleDaoService.saveReportingQuestionAnswer(parentEntity);
      console.log(`✅ Parent SUM created for location ${sourceId}, question ${questionId}`);
    }
  }

  async migrateParentAnswersForSublocations(req: any) {
    const { questionId, financialYearId } = req.query;

    if (!questionId || !financialYearId) {
      throw new HttpException(
        { status: 400, message: 'questionId and financialYearId required' },
        HttpStatus.BAD_REQUEST
      );
    }

    const qId = Number(questionId);
    const fyId = Number(financialYearId);

    // Fetch all sublocation answers
    const allAnswers = await this.reportingModuleDaoService.getReportingQuestionAnswers([qId], fyId);

    // Group by source + fromDate + toDate
    const groupedBySources = allAnswers.reduce((acc, ans) => {
      if (ans.subLocationId !== null && ans.subLocationId !== undefined) {
        const key = `${ans.sourceId}_${ans.fromDate}_${ans.toDate}`;
        if (!acc[key]) {
          acc[key] = {
            sourceId: ans.sourceId,
            fromDate: ans.fromDate,
            toDate: ans.toDate,
            sublocationAnswers: [],
            metadata: ans // Save metadata from first record
          };
        }
        acc[key].sublocationAnswers.push(ans);
      }
      return acc;
    }, {});

    let created = 0;
    let skipped = 0;

    for (const key in groupedBySources) {
      const group = groupedBySources[key];
      const { sourceId, fromDate, toDate, sublocationAnswers, metadata } = group;

      // Check if parent already exists
      const existingParent = await this.reportingModuleDaoService.getExistingRecordForCustom(
        qId, sourceId, fyId, fromDate, toDate
      );

      if (existingParent) {
        skipped++;
        continue;
      }

      // Calculate SUM
      let summedAnswer: number[][] | null = null;
      for (const subAnswer of sublocationAnswers) {
        if (!subAnswer.answer) continue;
        const parsedAnswer = JSON.parse(subAnswer.answer);

        if (!Array.isArray(parsedAnswer) || parsedAnswer.length === 0) continue;

        if (!summedAnswer) {
          summedAnswer = parsedAnswer.map(row => row.map(val => {
            const num = parseFloat(val);
            return isNaN(num) ? 0 : num;
          }));
        } else {
          parsedAnswer.forEach((row, i) => {
            if (summedAnswer![i]) {
              row.forEach((val, j) => {
                const num = parseFloat(val);
                if (!isNaN(num)) {
                  summedAnswer![i][j] += num;
                }
              });
            }
          });
        }
      }

      if (!summedAnswer) {
        continue;
      }

      // Create parent entity
      const parentEntity = this.createReportingAnswerEntity(
        metadata.userId,
        fyId,
        qId,
        sourceId,
        null, // Parent has null subLocationId
        metadata.moduleId,
        fromDate,
        toDate,
        metadata.notApplicable,
        JSON.stringify(summedAnswer),
        metadata.proofDocument,
        metadata.proofDocumentNote,
        metadata.note,
        metadata.questionType as QuestionType,
        metadata.companyId,
        metadata.questionnaireType as QuestionnaireType,
        metadata.status as QuestionStatus
      );

      await this.reportingModuleDaoService.saveReportingQuestionAnswer(parentEntity);
      created++;
      console.log(`✅ Created parent for sourceId=${sourceId}, fromDate=${fromDate}`);
    }

    throw new HttpException(
      {
        status: 200,
        message: 'Migration completed',
        created,
        skipped,
        total: created + skipped
      },
      HttpStatus.OK
    );
  }

  private createTrendsHistoryEntity(existingRecord: any, questionnaireType: QuestionnaireType): SectorQuestionTrendsHistoryAnswerEntity {
    return new SectorQuestionTrendsHistoryAnswerEntity(
      existingRecord.userId, existingRecord.financialYearId, existingRecord.frameworkId, existingRecord.topicId, existingRecord.kpiId, existingRecord.questionId,
      existingRecord.dateRangeSourceId, existingRecord.sourceId, existingRecord.questionType as QuestionType, existingRecord.fromDate, existingRecord.toDate, existingRecord.answer, existingRecord.notApplicable, existingRecord.readingValue,
      null, null, null, existingRecord.companyId, questionnaireType, existingRecord.updatedAt,
      existingRecord.status as QuestionStatus,
    );
  }

  private createAnswerEntity(
    systemUserId: any,
    item: any,
    companyId: any,
    questionnaireType: QuestionnaireType,
    status: QuestionStatus,
    tmpAnswer: any,
    financialYearId: any,
    proofDocument: any,
    note: any
  ): SectorQuestionAnswerEntity {
    return new SectorQuestionAnswerEntity(
      systemUserId,
      financialYearId,
      item.frameworkId,
      item.topicId ?? null,
      item.kpiId ?? null,
      item.id,
      String(tmpAnswer),
      note,
      tmpAnswer === 'Not Applicable' ? 'true' : 'false',
      1,
      proofDocument,
      null,
      null,
      companyId,
      item.questionType as QuestionType,
      questionnaireType,
      status
    );
  }

  private createTabularEnergyHistoryEntity(existingRecord: any, questionnaireType: QuestionnaireType): SectorQuestionTabularHistoryAnswerEntity {
    return new SectorQuestionTabularHistoryAnswerEntity(
      existingRecord.userId, existingRecord.financialYearId, existingRecord.frameworkId, existingRecord.topicId, existingRecord.kpiId, existingRecord.questionId,
      existingRecord.sourceId, existingRecord.questionType as QuestionType, existingRecord.answer, existingRecord.notApplicable, existingRecord.financialYearId, null, null, null, existingRecord.companyId,
      questionnaireType, existingRecord.updatedAt, existingRecord.status as QuestionStatus,
    );
  }

  private createEnergyTabularAnswerEntity(
    systemUserId: number,
    companyId: number,
    financialYearId: number,
    questionnaireType: QuestionnaireType,
    status: QuestionStatus,
    tmpAnswer: any,
    questionId: any,
    note: any
  ): SectorQuestionTabularAnswerEntity {
    const finalAnswer = tmpAnswer ? JSON.stringify(tmpAnswer) : '[]';
    const notApplicable = 'false';

    const performed = true; // update as needed
    const remark = '';

    return new SectorQuestionTabularAnswerEntity(
      systemUserId,
      financialYearId,
      1,
      null,
      null,
      questionId,
      1,
      'tabular_question' as QuestionType,
      finalAnswer,
      note,
      notApplicable,
      performed,
      null,
      null,
      remark,
      companyId,
      questionnaireType,
      status
    );
  }

  private createTabularAnswerEntity(
    systemUserId: number,
    item: any,
    answer: any,
    companyId: number,
    financialYearId: number,
    questionnaireType: QuestionnaireType,
    status: QuestionStatus,
    tmpAnswer: any,
    proofDocument: any,
    note: any
  ): SectorQuestionTabularAnswerEntity {
    const finalAnswer = tmpAnswer ? JSON.stringify(tmpAnswer) : '[]'; // default to valid JSON
    const finalNote = typeof answer?.note === 'string' ? answer.note : '';
    const notApplicable = typeof answer?.notApplicable === 'string'
      ? answer.notApplicable
      : answer?.notApplicable === true
        ? 'true'
        : answer?.notApplicable === false
          ? 'false'
          : '';

    const performed = true; // update as needed
    const remark = '';

    return new SectorQuestionTabularAnswerEntity(
      systemUserId,
      financialYearId,
      item.frameworkId,
      item.topicId ?? null,
      item.kpiId ?? null,
      item.id,
      1,
      'tabular_question' as QuestionType,
      finalAnswer,
      note,
      notApplicable,
      performed,
      proofDocument,
      null,
      remark,
      companyId,
      questionnaireType,
      status
    );
  }

  private async findUserOrgChartData(targetUserId: string) {
    const systemUserId = targetUserId;
    const { id: headOffice } = await this.userDaoService.getCompanyDetailsBasedOnParentIdNull();

    const getHeadOrgDetails = await this.orgChartDaoService.getOrgChartUserId(headOffice);
    const userOrgChart = await this.findUserOrgChart(JSON.parse(getHeadOrgDetails.orgChart), Number(systemUserId));
    return userOrgChart;
  }

  private async findUserOrgChartDataDirect(targetUserId: string) {
    const { id: headOffice } = await this.userDaoService.getCompanyDetailsBasedOnParentIdNull();
    const getHeadOrgDetails = await this.orgChartDaoService.getOrgChartUserId(headOffice);
    return JSON.parse(getHeadOrgDetails.orgChart)
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

  private createTrendsAnswerEntity(systemUserId: any, item: any, answer: any, financialYearId: number, companyId: any, questionnaireType: QuestionnaireType, status: QuestionStatus, tmpAnswer: any): SectorQuestionTrendsAnswerEntity {
    return new SectorQuestionTrendsAnswerEntity(
      systemUserId, financialYearId, item.frameworkId, item.topicId, item.kpiId, item.id,
      null, null, "quantitative_trends" as QuestionType, null, null,
      answer.answer, answer.notApplicable, tmpAnswer, answer?.note, null, null, null, companyId, questionnaireType, status,
    );
  }

  private async generatePeriods(frequency: string, startMonth: number, yearRange: string): Promise<Record<string, string>> {
    const [startYear, endYear] = yearRange.split("-").map(Number);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    let periods: Record<string, string> = {};

    if (frequency === "MONTHLY") {
      let year = startYear;
      for (let i = 0; i < 12; i++) {
        let monthIndex = (startMonth - 1 + i) % 12;
        if (startMonth - 1 + i >= 12) year = endYear; // Crossed into end year
        let monthName = months[monthIndex];
        let formattedMonth = String(monthIndex + 1).padStart(2, "0");
        periods[monthName] = `${year}-${formattedMonth}`;
      }
    }

    else if (frequency === "QUARTERLY") {
      let year = startYear;
      for (let i = 0; i < 4; i++) {
        let quarterStart = (startMonth - 1 + i * 3) % 12;
        let quarterEnd = (quarterStart + 2) % 12;
        if (startMonth - 1 + i * 3 >= 12) year = endYear;

        let label = `${months[quarterStart]} - ${months[quarterEnd]}`;
        let formattedStartMonth = String(quarterStart + 1).padStart(2, "0");
        periods[label] = `${year}-${formattedStartMonth}`;
      }
    }

    else if (frequency === "HALF_YEARLY") {
      const half1StartIndex = startMonth - 1;
      const half2StartIndex = (half1StartIndex + 6) % 12;

      const half1Label = `${months[half1StartIndex]} - ${months[(half1StartIndex + 5) % 12]}`;
      const half2Label = `${months[half2StartIndex]} - ${months[(half2StartIndex + 5) % 12]}`;

      const half1Month = String(half1StartIndex + 1).padStart(2, "0");
      const half2Month = String(half2StartIndex + 1).padStart(2, "0");

      const half2Year = (half2StartIndex < half1StartIndex) ? endYear : startYear;

      periods[half1Label] = `${startYear}-${half1Month}`;
      periods[half2Label] = `${half2Year}-${half2Month}`;
    }

    else if (frequency === "YEARLY") {
      const endMonthIndex = (startMonth - 2 + 12) % 12;
      const label = `${months[startMonth - 1]} - ${months[endMonthIndex]}`;
      periods[label] = `${startYear}-${String(startMonth).padStart(2, "0")}`;
    }

    return periods;
  }

  async updateTrainingData(financialYearId: number) {
    const company = await this.userDaoService.getHeadOfficeCompanyDetails(true);
    const companyId = company?.company_id;

    const frameworkIds = (await this.externalApiCallService.getReq(
      process.env.COMPANY_SERVER_API_URL + 'getFramework',
      { companyId, type: 'ALL', user_type_code: 'company' },
      {},
    )).data.map((obj) => obj.id);

    const queryParam = {
      company_id: companyId,
      user_type_code: 'COMPANY',
      framework_ids: frameworkIds,
    };

    const getTrainingCategory = await this.externalApiCallService.getReq(
      process.env.COMPANY_SERVER_API_URL + 'getTrainingCategories',
      queryParam,
      {},
    );

    const categoryList = getTrainingCategory.data.trainingCategories;

    type FinancialYear = { id: number; financial_year_value: string };

    const financialYearData: { data: FinancialYear[] } = await this.externalApiCallService.getReq(
      process.env.COMPANY_SERVER_API_URL + 'getFinancialYear',
      { userId: companyId, type: 'COMPANY' },
      {},
    );

    const currFinancialYearValue = financialYearData.data.find(
      (fy: FinancialYear) => fy.id == Number(financialYearId)
    )?.financial_year_value || "Not Found";

    const financialYearRange = await this.getFinancialYearRange(
      currFinancialYearValue,
      company?.starting_month - 1
    );

    const trainingData = await this.trainingDaoService.getHeadAllTrainingListWithUserDetailsForGraph(
      Number(financialYearId),
      categoryList,
      1,
      financialYearRange.fromDate,
      financialYearRange.toDate
    );

    const traineeList = await this.traineeDaoService.getRegisteredTraineesBasedOnCompany('Kennametal India Limited (KIL)');

    if (!traineeList.length) {
      return {
        principles: {},
        trainingPrograms: [],
      };
    }

    const principlesMap = {};
    if (trainingData.length > 0 && trainingData[0].allPrinciples) {
      trainingData[0].allPrinciples.forEach((principle, index) => {
        principlesMap[`P${index + 1}`] = principle.title;
      });
    }

    const allCategories = [
      'Board of Directors',
      'Key Managerial Personnel',
      'Employees other than BoD and KMPs',
      'Workers'
    ];

    const traineesByCategory = {};
    allCategories.forEach(cat => {
      traineesByCategory[cat] = [];
    });

    traineeList.forEach(trainee => {
      const category = this.categorizeEmployee(trainee);
      if (traineesByCategory[category]) {
        traineesByCategory[category].push(trainee);
      }
    });

    const trainingPrograms = {};
    allCategories.forEach(category => {
      trainingPrograms[category] = {
        totalEmployees: traineesByCategory[category].length,
        principleCompliance: {}
      };

      Object.keys(principlesMap).forEach(principleKey => {
        trainingPrograms[category].principleCompliance[principleKey] = {
          status: "No",
          covered: 0,
          percentage: 0,
          uniqueEmployees: new Set()
        };
      });
    });

    trainingData.forEach(training => {
      const attendants = training.attendantUsers || [];
      const trainingPrinciples = training.principles || [];

      attendants.forEach(attendant => {
        const category = this.categorizeEmployee(attendant);
        const employeeId = attendant.id || attendant.employeeId;

        if (trainingPrograms[category] && employeeId) {
          trainingPrinciples.forEach(principle => {
            const principleIndex = training.allPrinciples?.findIndex(p => p.id === principle.id);
            if (principleIndex !== -1) {
              const principleKey = `P${principleIndex + 1}`;
              const compliance = trainingPrograms[category].principleCompliance[principleKey];

              if (compliance) {
                compliance.uniqueEmployees.add(employeeId);
                compliance.status = "Yes";
              }
            }
          });
        }
      });
    });

    Object.keys(trainingPrograms).forEach(category => {
      const totalEmployees = trainingPrograms[category].totalEmployees;

      Object.keys(trainingPrograms[category].principleCompliance).forEach(principleKey => {
        const compliance = trainingPrograms[category].principleCompliance[principleKey];
        compliance.covered = compliance.uniqueEmployees.size;
        compliance.percentage = totalEmployees > 0
          ? Math.round((compliance.covered / totalEmployees) * 100 * 100) / 100
          : 0;
        delete compliance.uniqueEmployees;
      });
    });

    // Construct 2D result array with proper format
    const result: string[][] = [];
    const principleKeys = Object.keys(principlesMap); // P1 to P9

    for (const category of allCategories) {
      const row: string[] = [];
      const categoryData = trainingPrograms[category];

      const attendedTrainings = trainingData.filter(td =>
        (td.attendantUsers || []).some(att => this.categorizeEmployee(att) === category)
      );

      const allTopics = [...new Set(attendedTrainings.map(t => t['trainingTitle']).filter(Boolean))];
      const totalPrograms = attendedTrainings.length;

      row.push(totalPrograms.toString());
      row.push(allTopics.join(', ') || "N/A");

      for (const pKey of principleKeys) {
        const compliance = categoryData.principleCompliance[pKey];
        row.push(compliance?.status || "No");
      }

      const uniqueEmployeeIds = new Set();
      attendedTrainings.forEach(training => {
        (training.attendantUsers || []).forEach(att => {
          if (this.categorizeEmployee(att) === category && (att.id || att.employeeId)) {
            uniqueEmployeeIds.add(att.id || att.employeeId);
          }
        });
      });

      const avgCoverage = categoryData.totalEmployees > 0
        ? Math.round((uniqueEmployeeIds.size / categoryData.totalEmployees) * 100)
        : 0;

      row.push(`${avgCoverage}%`);
      result.push(row);
    }

    return result;
  }

  private categorizeEmployee(user: any): string {
    const category = user.categoryId?.toLowerCase();

    if (category?.includes('bod') || category?.includes('director')) {
      return 'Board of Directors';
    } else if (category?.includes('kmp')) {
      return 'Key Managerial Personnel';
    } else if (category?.includes('permanent employee') || category?.includes('other than permanent employee')) {
      return 'Employees other than BoD and KMPs';
    } else if (category?.includes('permanent worker') || category?.includes('other than permanent worker')) {
      return 'Workers';
    } else {
      return 'Employees other than BoD and KMPs';
    }
  }

  async calculateFormulaResult(companyDetails, reportingQuestion, financialYearId, reportingQuestionsMap, groupedAnswers = null) {
    const { companyId } = companyDetails;
    const { questionId, questionType, title, formula, variablesJson, moduleId, frequency, details } = reportingQuestion;

    // Handle variablesJson - it might be a string, null, or already an array
    let variables = variablesJson;
    if (typeof variablesJson === 'string') {
      try {
        variables = JSON.parse(variablesJson);
      } catch (error) {
        console.error(`Error parsing variablesJson for question ${questionId}:`, error);
        variables = [];
      }
    }

    // Ensure variables is an array
    if (!Array.isArray(variables)) {
      console.error(`variablesJson is not an array for question ${questionId}, received:`, typeof variablesJson, variablesJson);
      variables = [];
    }

    const parsedVariables = variables.map(label => this.commonUtilityService.parseReportingQuestionId(label));
    const questionIds = [...new Set(parsedVariables.map(v => v.questionId))] as number[];

    const invalidIds = questionIds.filter(id => !(`${id}` in reportingQuestionsMap));
    if (invalidIds.length > 0) {
      throw new HttpException(
        `One or more dependent questions are invalid`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    let grouped = groupedAnswers ?? {};
    if (!groupedAnswers) {
      const reportingAnswers = await this.reportingModuleDaoService
        .getReportingQuestionAnswers(questionIds, Number(financialYearId));

      for (const item of reportingAnswers) {

        const locationKey = item.subLocationId
          ? `${item.sourceId}_${item.subLocationId}`
          : `${item.sourceId}`;

        const periodKey = `${item.fromDate}_${item.toDate}`;

        if (!grouped[locationKey]) grouped[locationKey] = {};
        if (!grouped[locationKey][periodKey]) grouped[locationKey][periodKey] = {};

        grouped[locationKey][periodKey][item.questionId] = item;
      }
    }

    const results = [];

    // Loop over locations
    for (const locationKey of Object.keys(grouped)) {

      // Loop over periods inside location
      for (const periodKey of Object.keys(grouped[locationKey])) {

        const periodData = grouped[locationKey][periodKey];

        // Build expression for this location-period
        let expression = formula;
        let allNotApplicable = true;
        for (const variable of parsedVariables) {

          const item = periodData[variable.questionId];

          allNotApplicable = allNotApplicable && item?.notApplicable === true;
          let value = 0;
          if (!item?.notApplicable && item && item.answer) {
            try {
              value = await this.getReportingQuestionAnswerValue(item.questionType, variable, item.answer);
            } catch (err) {
              value = 0;
            }
          }

          // Replace ALL occurrences of variable label
          expression = expression.replaceAll(`{{${variable.full}}}`, value.toString());
        }

        let finalValue: any;

        try {
          finalValue = Function(`"use strict"; return (${expression});`)();

          // If result is invalid math, mark as NA
          if (isNaN(finalValue) || !isFinite(finalValue)) {
            finalValue = "NA";
          } else {
            finalValue = Number(finalValue.toFixed());
          }
        } catch (err) {
          // Any parse/eval error also results in NA
          finalValue = "NA";
        }

        // Build output format compatible with reporting
        const [fromDate, toDate] = periodKey.split("_");
        const [sourceId, subLocationId] = locationKey.split("_");

        if (questionType === 'quantitative_trends') {
          results.push({
            financialYearId: financialYearId,
            questionId: questionId,
            sourceId: Number(sourceId),
            subLocationId: isNaN(Number(subLocationId)) ? null : Number(subLocationId),
            moduleId: moduleId,
            fromDate: fromDate,
            toDate: toDate,
            notApplicable: allNotApplicable || finalValue === 'NA',
            answer: JSON.stringify({
              questionId: questionId,
              moduleId: moduleId,
              questionType: questionType,
              questionTitle: title,
              fromDate: fromDate,
              toDate: toDate,
              frequency: frequency,
              readingValue: allNotApplicable ? 'NA' : finalValue,
              unit: details?.[0]?.['option'] ?? 'Number'
            }),
            proofDocument: [],
            proofDocumentNote: null,
            status: "ANSWERED",
            note: [],
            questionType: questionType,
            companyId: companyId,
            questionnaireType: "CA",
            historyAnswer: []
          });
        } else if (['qualitative', 'quantitative'].includes(questionType)) {
          results.push({
            financialYearId: financialYearId,
            questionId: questionId,
            sourceId: Number(sourceId),
            subLocationId: isNaN(Number(subLocationId)) ? null : Number(subLocationId),
            moduleId: moduleId,
            fromDate: fromDate,
            toDate: toDate,
            notApplicable: allNotApplicable || finalValue === 'NA',
            answer: allNotApplicable ? 'NA' : String(finalValue),
            proofDocument: [],
            proofDocumentNote: null,
            status: "ANSWERED",
            note: [],
            questionType: questionType,
            companyId: companyId,
            questionnaireType: "CA",
            historyAnswer: []
          });
        } else {
          throw new HttpException('Unsupported question type', HttpStatus.INTERNAL_SERVER_ERROR);
        }
      }
    }

    return results;
  }

  getReportingQuestionAnswerValue(questionType, variable, answer) {
    if (["qualitative", "quantitative"].includes(questionType)) {
      const typedAnswer = Number(answer);
      if (!isNaN(typedAnswer)) {
        return typedAnswer;
      }

      return 0;
    }

    if (questionType === "quantitative_trends") {
      try {
        const typedAnswer = Number(JSON.parse(answer).readingValue);
        if (!isNaN(typedAnswer)) {
          return typedAnswer;
        }

        return 0;
      } catch (err) {
        return 0;
      }
    }

    if (questionType === "tabular_question") {
      try {
        const typedAnswer = Number(JSON.parse(answer)[variable.row][variable.col]);
        if (!isNaN(typedAnswer)) {
          return typedAnswer;
        }

        return 0;
      } catch (err) {
        return 0;
      }
    }

    throw new HttpException("Invalid question type", HttpStatus.INTERNAL_SERVER_ERROR);
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

    console.log(`${endY}-${mm(tmpendMonth)}-${mm(lastDay)}`)


    return {
      fromDate: `${startY}-${mm(startMonth)}`, // inclusive
      toDate: `${endY}-${mm(endMonth)}`,       // exclusive
      displayName: `${months[startMonthIdx]} - ${months[endMonth - 1]}`,
      calEndMonth: `${endY}-${mm(tmpendMonth)}-${mm(lastDay)}`
    };
  }

}