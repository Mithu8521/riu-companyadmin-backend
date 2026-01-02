import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ExternalApiCallService } from '@utils/common/external-api-call/external-api-call.service';
import { UserDaoService } from '@modules/dao/setting/user-dao/user-dao.service';
import { AssignQuestionDto } from './dto/assign-sector-question.dto';
import { AssignQuestionEntity } from './entities/assign_question.entity';
import { SectorQuestionDaoModuleService } from '@modules/dao/sector-question-dao-module/sector-question-dao-module.service';
import { SubUserDaoService } from '@modules/dao/setting/sub-user-dao/sub-user-dao.service';
import { SaveAnswerQuestionDto } from './dto/save-answer-sector-question.dto';
import { SectorQuestionAnswerEntity } from './entities/sector_question_answers.entity';
import { SectorQuestionTabularAnswerEntity } from './entities/sector_tabular_question_answer.entity';
import { SectorQuestionTrendsAnswerEntity } from './entities/sector_question_trends_answer.entity';
import { SectorQuestionHistoryAnswerEntity } from './entities/sector_question_answers_history.entity';
import { SectorQuestionTabularHistoryAnswerEntity } from './entities/sector_tabular_question_answer_history.entity';
import { SectorQuestionTrendsHistoryAnswerEntity } from './entities/sector_question_trends_answer_history.entity';
import { AuditListingDaoService } from '@modules/dao/audit/audit-listing-dao/audit-listing-dao.service';
import { AuditListingEntity } from '@modules/audit/entities/audit_listing.entity';
import { ModuleType, QuestionStatus, QuestionType, QuestionnaireType } from '@utils/enums/Status';
import { SocketService } from '@modules/socket/socket.service';
import { UserNotificationEntity } from '@modules/setting/user/entities/user_notification.entity';
import { RequestDueDateDto } from './dto/request-due-date.dto';
import { UpdateDueDateDto } from './dto/update-due-date.dto';
import { ReminderUserDto } from './dto/remider-user.dto';
import { DashboardDaoService } from '@modules/dao/dashboard-dao/dashboard-dao.service';
import { TodaysActivity } from '@modules/dashboard/entities/today_activity.entity';
import { SourceDaoService } from '@modules/dao/setting/source-dao/source-dao.service';
import { ProcessDaoService } from '@modules/dao/setting/process-dao/process-dao.service';
import { EsgReportingDaoService } from '@modules/dao/esg-reporting-dao/esg-reporting-dao.service';
import { ReAssignQuestionDto } from './dto/reassign-sector-question.dto';
import { LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { AddRowSectorQuestionDto } from './dto/add-row-sector-question.dto';
import { SectorQuestionDetailsEntity } from '@modules/global_controles/sector_question/entities/sector_question_details.entity';
import { SectorQuestionDaoService } from '@modules/dao/global_controles/sector-question-dao/sector-question-dao.service';
import { S3 } from 'aws-sdk';
import * as puppeteer from 'puppeteer';
import * as ejs from 'ejs';
import * as path from 'path';
import * as ExcelJS from 'exceljs';
import { create } from 'xmlbuilder2';
import { ReportingModuleDaoService } from '@modules/dao/reporting-module-dao/reporting-module-dao.service';
import * as fs from "fs";
import * as HTMLtoDOCX from "html-to-docx";
import * as pdfParse from "pdf-parse";
import { PDFDocument, rgb } from "pdf-lib";
import mammoth from "mammoth";
import libre from "libreoffice-convert"; // Convert DOCX to PDF
import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import { EmailReminderDto } from './dto/email-reminder.dto';
import { SendMailService } from '@utils/common/send-mail/send-mail.service';
import { assert } from 'console';
import { json } from 'stream/consumers';
import * as mime from "mime-types";
import { ReportGenerationSettingDto, ReportGenerationSettingsDto } from './dto/report-generation-settings.dto';
import { plainToInstance } from 'class-transformer';
import { GenerateReportRequestDto, GenerateReportResponseDto } from './dto/generate-report.dto';
import { SuperAdminClientService } from '@modules/super-admin-client/super-admin-client.service';
import { ReportGenerationSettingEntity } from './entities/report-generation-settings.entity';
import axios from 'axios';

interface FormData {
  id: number;
  formula?: string;
  questionType: string;
}
@Injectable()
export class SectorQuestionService {
  private s3: S3;
  private blobServiceClient: BlobServiceClient;
  private containerClient: ContainerClient;

  constructor(private externalApiCallService: ExternalApiCallService, private userDaoService: UserDaoService, private subUserDaoService: SubUserDaoService, private dashboardDaoService: DashboardDaoService,
    private sectorQuestionDaoModuleService: SectorQuestionDaoModuleService, private auditListingDaoService: AuditListingDaoService, private readonly socketService: SocketService, private sourceDaoService: SourceDaoService,
    private processDaoService: ProcessDaoService, private esgReportingDaoService: EsgReportingDaoService, private sectorQuestionDaoService: SectorQuestionDaoService, private reportingModuleDaoService: ReportingModuleDaoService,
    private sendMailService: SendMailService, private superAdminClientService: SuperAdminClientService
  ) {
    this.s3 = new S3({
      accessKeyId: 'AKIASLBAM55PEV2BZH5U',
      secretAccessKey: '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',
      region: 'ap-south-1',
    });
    const azureStorageConnectionString = `DefaultEndpointsProtocol=https;AccountName=copyadatafromawstoazure;AccountKey=Rm0FDmsdlyzLLtEeaJZ2euskxk3dD0KcZqLyUVf5J5RH8CfyGNaL+xhkuLPt/YaYH6kqyVc7YYne+AStRYr2eg==;EndpointSuffix=core.windows.net`;
    const containerName = 'uploads';

    this.blobServiceClient = BlobServiceClient.fromConnectionString(azureStorageConnectionString);
    this.containerClient = this.blobServiceClient.getContainerClient(containerName);

    this.containerClient.createIfNotExists({ access: 'blob' }).then(() => {
      console.log(`Container '${containerName}' is ready.`);
    }).catch((err) => {
      console.error('Error creating container:', err);
    });
  }



  async getSectorQuestion(req: any) {
    const systemUserId = req.headers.userid;
    const getCompany = await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId);
    const headCompanyCompany = await this.userDaoService.getHeadOfficeCompanyDetails(true);
    const muduleType = req.query.muduleType;
    const questionsIds = req.query.questionIds
    const { fromDate, toDate, locationIds, userIds } = req.query
    let getAssignedDetails
    if (toDate !== 'undefined' && fromDate === 'undefined') {
      throw new HttpException(
        { status: 400, message: 'From Date Mandatory', },
        HttpStatus.CONFLICT,
      );
    }
    if (toDate === 'undefined' && fromDate !== 'undefined') {
      throw new HttpException(
        { status: 400, message: 'To Date Mandatory', },
        HttpStatus.CONFLICT,
      );
    }
    const frameworkIds = getCompany.parent_id
      ? (await this.externalApiCallService.getReq(
        process.env.COMPANY_SERVER_API_URL + 'getFramework',
        { companyId: getCompany.company_id, type: 'ALL', user_type_code: 'company' },
        {},
      )).data.map((obj) => obj.id)
      : req.query.frameworkIds;
    let assignedDetail
    if (getCompany.parent_id !== null) {
      assignedDetail = await this.sectorQuestionDaoModuleService.getQuestionIds([Number(systemUserId)], Number(req.query.financialYearId))
    }
    if (assignedDetail?.length === 0 && getCompany.parent_id !== null) {
      throw new HttpException(
        { status: 200, message: 'No Data Found', data: [], answers: [], assignedDetails: [] },
        HttpStatus.OK,
      );
    } else {
      const queryParam = {
        companyId: getCompany.company_id,
        type: req.query.type,
        user_type_code: 'company',
        entity: 'company',
        framework_ids: frameworkIds,
        topic_ids: req.query.topicIds,
        kpi_ids: req.query.kpiIds,
        financial_year_id: 6,
        // financial_year_id: req.query.financialYearId,
        questionnaire_type: req.query.questionnaireType,
        qIds: getCompany.parent_id ? await this.sectorQuestionDaoModuleService.getQuestionIds([Number(systemUserId)], 6) : undefined,
      };
      if (muduleType === "AUDIT") {
        const auditDetails = await this.auditListingDaoService.getAuditQuestionIdsAndAuditIds(systemUserId, 6);
        const questionIds = auditDetails.map((details) => details.questionId);
        queryParam.qIds = questionIds;
      } else {
        queryParam.qIds = getCompany.parent_id
          ? await this.sectorQuestionDaoModuleService.getQuestionIds([Number(systemUserId)], 6)
          : undefined;
      }
      if (questionsIds && questionsIds !== 'undefined') {
        queryParam.qIds = JSON.parse(questionsIds);
      }
      if (req.query.frameworkIds === "[]") {
        const headCompany = await this.userDaoService.getHeadOfficeCompanyDetails(true);
        const getESGReport = await this.esgReportingDaoService.getEsgReportingBasedOnUserId(headCompany.id);
        const frameworkTopicKpi = JSON.parse(getESGReport[0]?.frameworkTopicKpi);
        const topicIds = [...(frameworkTopicKpi?.mandatoryTopicsId ?? []), ...(frameworkTopicKpi?.voluntaryTopicsId ?? []), ...(frameworkTopicKpi?.customTopicsId ?? [])];
        queryParam.framework_ids = frameworkTopicKpi.frameworkId;
        queryParam.topic_ids = topicIds;
        queryParam.kpi_ids = undefined;
        const params = {
          sourceIds: locationIds !== 'undefined' && locationIds !== '[]' ? JSON.parse(locationIds) : undefined,
          assignedTo: userIds !== 'undefined' && userIds !== '[]' ? JSON.parse(userIds) : undefined
        };

        Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);
        const fromDateFilter = fromDate !== 'undefined' ? { dueDate: MoreThanOrEqual(fromDate) } : {};
        const toDateFilter = toDate !== 'undefined' ? { dueDate: LessThanOrEqual(toDate) } : {};

        getAssignedDetails = await this.sectorQuestionDaoModuleService.getAssignedDetailsBasedOnAssignTo(Number(systemUserId), {
          ...params,
          ...fromDateFilter,
          ...toDateFilter
        }, req.query.financialYearId);
        if (!getAssignedDetails.length) {
          throw new HttpException(
            { status: 200, message: 'Data Found', data: [], answers: [], assignedDetails: [] },
            HttpStatus.OK,
          );
        }
        const arrayOfIds = getAssignedDetails.map(obj => obj.questionId);
        queryParam.qIds = arrayOfIds;
      }
      const getSectorQuestion = await this.externalApiCallService.getReq(
        process.env.COMPANY_SERVER_API_URL + 'getSectorQuestion',
        queryParam,
        {},
      );

      if (req.query.frameworkIds != "[]") {
        getAssignedDetails = await this.sectorQuestionDaoModuleService.getAssignedQuestion(req.query.financialYearId);
      }
      const getUsers = await this.userDaoService.getUsers(true);

      const auditDetail = await this.auditListingDaoService.getAuditHistoryQuestionIds(Number(req.query.financialYearId));
      let mainQuestions = getSectorQuestion.data;

      const newArray = [];
      const queryParamForReporting = {
        company_id: getCompany.company_id,
        user_type_code: 'COMPANY',
        framework_ids: frameworkIds,
      };

      const getReportingQuestion = await this.externalApiCallService.getReq(
        process.env.COMPANY_SERVER_API_URL + 'getReportingQuestion',
        queryParamForReporting,
        {},
      );

      const reportinguestionData = getReportingQuestion['data'];
      const reportingAnswer = await this.reportingModuleDaoService.getReportingQuestionAnswerBasedFnancialIds(Number(req.query.financialYearId));

      mainQuestions.forEach(item => {
        const formula = (() => {
          try {
            return JSON.parse(item.formula);
          } catch {
            return item.formula;
          }
        })();

        let questionIds: number[] = [];

        if (typeof formula === 'string') {
          const match = formula.match(/Q(\d+)/g);
          if (match) questionIds = match.map(m => parseInt(m.replace('Q', ''), 10));
        } else if (Array.isArray(formula)) {
          formula.forEach(subArray => {
            subArray.forEach(subFormula => {
              const match = subFormula.match(/Q(\d+)/g);
              if (match) questionIds.push(...match.map(m => parseInt(m.replace('Q', ''), 10)));
            });
          });
        }

        let allDataOwners: any[] = [];
        let allDataCheckers: any[] = [];
        let allQuestionData: any[] = [];

        questionIds.forEach(qid => {
          const assigned = getAssignedDetails.find(d => d.questionId == qid);
          if (qid == 75 || qid == 190 || qid == 191 || qid == 236) {
            allDataCheckers.push(headCompanyCompany)
            const newUser = {
              ...headCompanyCompany,
              first_name: 'RIU',
              last_name: '',
              designation: 'Marketing'
            };
            allDataOwners.push(newUser);
            const questionDataMatches = reportinguestionData.filter(q => q.questionId == qid);
            questionDataMatches.forEach(q => {
              q.status = 'Accepted';
            });
            allQuestionData.push(...questionDataMatches);

          } else {

            if (assigned) {
              const owners = getUsers.filter(u => assigned.assignedTo?.includes(String(u.id)));
              allDataOwners.push(...owners);

              const auditorRecords = auditDetail.filter(d => d.questionId == qid);
              auditorRecords.forEach(a => {
                if (Array.isArray(a.remark) && a.remark.length > 0) {
                  a.remark.forEach(r => {
                    const userDetails = getUsers.find(u => u.id == r.id);
                    if (userDetails) allDataCheckers.push({ ...r, ...userDetails });
                  });
                } else {
                  const userDetails = getUsers.find(u => u.id == a.auditorId || a.id);
                  if (userDetails) allDataCheckers.push(userDetails);
                }
              });
            }

            const questionDataMatches = reportinguestionData.filter(q => q.questionId == qid);
            const answerDataMatches = reportingAnswer.filter(q => q.questionId == qid);

            const allStatuses = answerDataMatches.map(item => item.status);

            let questionStatus: string;

            if (allStatuses.length === 0) {
              questionStatus = 'Not Answered';
            } else if (allStatuses.every(s => s === 'ACCEPTED')) {
              questionStatus = 'Accepted';
            } else if (allStatuses.every(s => s === 'REJECTED')) {
              questionStatus = 'Rejected';
            } else {
              questionStatus = 'Answered';
            }

            questionDataMatches.forEach(q => {
              q.status = questionStatus;
              q.answerDataMatches=answerDataMatches;
            });
            allQuestionData.push(...questionDataMatches);
          }

        });

        const dedupeById = (arr: any[]) => [...new Map(arr.map(d => [d.id, d])).values()];
        const dedupeByQuestionId = (arr: any[]) => [...new Map(arr.map(d => [d.questionId, d])).values()];

        item.indexDetails = {
          dataOwnerDetails: dedupeById(allDataOwners),
          dataCheckerDetails: dedupeById(allDataCheckers),
          questionDataDetails: dedupeByQuestionId(allQuestionData)
        };
      });

      if (mainQuestions.length) {
        const getQuestionDetails = await this.sectorQuestionDaoService.getAllSectorQuestionDetails();
        let groupedNewObjects = {};
        getQuestionDetails.forEach(obj => {
          if (!groupedNewObjects[obj.questionId]) {
            groupedNewObjects[obj.questionId] = [];
          }
          // Adjust property names to match the format used in the code
          let adjustedObject = {
            "id": obj.id,
            "question_id": obj.questionId,
            "option_type": obj.optionType,
            "option": obj.option,
            "rules": obj.rules,
            "createdAt": obj.createdAt,
            "updatedAt": obj.updatedAt
          };
          groupedNewObjects[obj.questionId].push(adjustedObject);
        });

        // Iterate over groupedNewObjects and update mainQuestions directly for matching question ids
        Object.entries(groupedNewObjects).forEach(([questionId, objects]) => {
          let index = mainQuestions.findIndex(obj => obj.id === parseInt(questionId));
          if (index !== -1) {
            mainQuestions[index].question_detail = mainQuestions[index].question_detail.concat(objects);
          }
        });

      }


      const answer = await this.getSectorQuestionAnswer(systemUserId, Number(req.query.financialYearId));
      if (mainQuestions.length) {
        throw new HttpException(
          { status: 200, message: 'Data Found', data: mainQuestions, answers: answer, assignedDetails: newArray },
          HttpStatus.OK,
        );
      } else {
        throw new HttpException({ status: 400, message: 'No active plan found!' }, HttpStatus.CONFLICT);
      }
    }


  }


  async getReportGenerated(req: any) {
    const browser = await puppeteer.launch({
      args: ['--no-sandbox'],
      headless: true,
    });
    const [page] = await browser.pages();
    let html;

    try {
      html = await ejs.renderFile(
        path.join(__dirname, '/../../public/views/report/brsrreport.ejs'),
        {}
      );
    } catch (error) {
      console.error('Error rendering EJS file:', error);
      // Handle the error appropriately here
    }
    await page.setContent(html);
    const pdfBuffer = await page.pdf({
      format: 'A4',
      preferCSSPageSize: true,
      scale: 0.6,
      printBackground: true,
      displayHeaderFooter: false,
    });

    const fileName = `BRSR_${Date.now()}.pdf`;

    const blockBlobClient = this.containerClient.getBlockBlobClient(fileName);
    await blockBlobClient.uploadData(pdfBuffer, {
      blobHTTPHeaders: { blobContentType: "application/pdf" },
    });

    console.log("✅ PDF Uploaded Successfully to Azure:", blockBlobClient.url);
    return { url: blockBlobClient.url };
  }

  async getSectorQuestionAnswers(req: any) {
    const systemUserId = req.headers.userid;
    const getCompany = await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId);
    const { fromDate, locationIds, financialYearId, type } = req.query;

    let convertedFromDate, convertedLocationIds;
    try {
      const preprocess = (input: string) => JSON.parse(input.replace(/([\w-]+)/g, '"$1"'));
      convertedFromDate = preprocess(fromDate);
      convertedLocationIds = preprocess(locationIds);
    } catch (error) {
      throw new HttpException(
        { status: 400, message: 'Invalid JSON format in query parameters' },
        HttpStatus.BAD_REQUEST,
      );
    }

    const frameworkResponse = await this.externalApiCallService.getReq(
      `${process.env.COMPANY_SERVER_API_URL}getFramework`,
      { companyId: getCompany.company_id, type: 'ALL', user_type_code: 'company' },
      {}
    );
    const frameworkIds = frameworkResponse.data.map((obj: any) => obj.id);

    const queryParam = {
      companyId: getCompany.company_id,
      type: 'CUSTOM',
      user_type_code: 'company',
      entity: 'company',
      framework_ids: frameworkIds,
      topic_ids: '[]',
      kpi_ids: '[]',
      financial_year_id: Number(financialYearId),
      questionnaire_type: 'SQ',
      qIds: undefined,
    };

    const getSectorQuestion =
      await this.externalApiCallService.getReq(
        `${process.env.COMPANY_SERVER_API_URL}getSectorQuestion`,
        queryParam,
        {}
      );

    const reportingAnswer = await this.reportingModuleDaoService.getReportingQuestionAnswersBasedOnFilter(
      convertedFromDate,
      convertedLocationIds,
      financialYearId
    );

    const mainQuestions = getSectorQuestion.data;
    for (const mainItem of mainQuestions) {
      const formula = mainItem.formula;
      const answer = await this.computationReportingQuestionAnswer(formula, reportingAnswer, mainItem);
      mainItem.answer = answer;
    }
    if (type == 'PDF') {
      const companyData = await this.userDaoService.getHeadOfficeCompanyDetails(true);
      let companyName = companyData.register_company_name;

      let questionIds = getSectorQuestion['questionIds'];
      let jsonObj = {};

      mainQuestions.forEach((question) => {
        questionIds.push(question["id"]);
        jsonObj[question["id"]] = {
          ...question,
          Answer: question?.questionType === "tabular_question" ? [] : question.answer,
        };
      });

      let mainJson = {};
      let topicIdToTopicNameMapping = {};

      Object.values(jsonObj).forEach((obj) => {
        if (typeof obj === 'object' && obj !== null) {
          if (!mainJson[obj["topicId"]]) {
            mainJson[obj["topicId"]] = {};
          }
          if (!Object.keys(mainJson[obj["topicId"]]).includes(obj['heading'])) {
            mainJson[obj["topicId"]][obj["heading"]] = [];
          }
          let tempJson = { ...obj };
          delete tempJson["topicId"];
          mainJson[obj["topicId"]][obj["heading"]].push(tempJson);

          topicIdToTopicNameMapping[obj["topicId"]] = obj["topic_name"];
        }
      });



      if (true) {
        const browser = await puppeteer.launch({
          args: ['--no-sandbox'],
          headless: true,
        });
        const [page] = await browser.pages();
        const meterIdToNameObject = [];
        const financialYearValue = financialYearId;
        let html;

        try {
          html = await ejs.renderFile(
            path.join(__dirname, '/../../public/views/report/report.ejs'),
            { mainJson, topicIdToTopicNameMapping, financialYearValue, companyName, meterIdToNameObject }
          );
        } catch (error) {
          console.error('Error rendering EJS file:', error);
          // Handle the error appropriately here
        }
        await page.setContent(html);
        const pdfBuffer = await page.pdf({
          format: 'A3',
          preferCSSPageSize: true,
          scale: 0.5,
          printBackground: true,
        });
        const fileName = `BRSR_${Date.now()}.pdf`;
        if (!pdfBuffer) {
          console.error('Invalid file:', pdfBuffer);
          throw new Error('Invalid file.');
        }

        const key = `riu/reports/${fileName}`;
        const uploadResponse = await this.s3
          .upload({
            Bucket: 'riu-bucket',
            Key: key,
            Body: pdfBuffer,
            ACL: 'public-read',
            ContentType: 'application/pdf', // Assuming the file is a PDF
          })
          .promise();

        throw new HttpException(
          { status: 200, data: uploadResponse.Location },
          HttpStatus.OK,
        );
        // await this.uploadFileToS3(pdfBuffer, fileName);

      }
    } else {
      if (mainQuestions.length) {
        throw new HttpException(
          {
            status: 200,
            message: 'Data Found',
            data: mainQuestions,
          },
          HttpStatus.OK
        );
      } else {
        throw new HttpException({ status: 400, message: 'No active plan found!' }, HttpStatus.CONFLICT);
      }
    }

  }


  private async computationReportingQuestionAnswer(formula: any, reportingAnswer: any, questionDetail: any) {
    if ((questionDetail.questionType === "qualitative") || (questionDetail.questionType === "yes_no") || (questionDetail.questionType === "quatitative")) {
      return await this.calculateFinalAnswerForOtherType(reportingAnswer, formula);


    } else if (questionDetail.questionType === "tabular_question") {
      return await this.calculateFinalAnswer(reportingAnswer, JSON.parse(formula));


    } else if (questionDetail.questionType === "quantitative_trends") {
      return await this.calculateFinalTrendsAnswer(reportingAnswer, formula);

    }
  }



  private async calculateFinalAnswer(answers: any, formula: string[][]): Promise<any[]> {

    const getValue = (questionId: number, row: number, col: number): string => {
      const relevantAnswers = answers.filter(a => a.questionId === questionId);
      if (relevantAnswers.length === 0) return '0';

      let sum = 0;
      let combinedString = '';
      let hasNonNumeric = false;

      relevantAnswers.forEach(answer => {
        const parsedAnswer = JSON.parse(answer.answer);
        if (parsedAnswer[row] && parsedAnswer[row][col] !== undefined) {
          const cellValue = parsedAnswer[row][col];
          if (cellValue === '' || isNaN(cellValue)) {
            if (cellValue !== '') {
              combinedString += cellValue + ' ';
            }
            hasNonNumeric = true;
          } else {
            sum += parseFloat(cellValue);
          }
        }
      });

      if (hasNonNumeric && combinedString.trim() !== '') {
        return combinedString.trim();
      } else {
        return sum.toString();
      }
    };

    const replacedFormula = formula.map(row =>
      row.map(cell => {
        if (!cell) return cell;
        return cell.replace(/Q(\d+)R(\d+)C(\d+)/g, (_, qId, r, c) => {
          const value = getValue(parseInt(qId), parseInt(r) - 1, parseInt(c) - 1);
          return isNaN(Number(value)) ? `"${value}"` : value;
        });
      })
    );


    const evaluatedFormula = replacedFormula.map(row =>
      row.map(cell => {
        if (!cell || cell.includes('"')) return cell.replace(/"/g, '');
        try {
          const result = eval(cell);
          return isNaN(result) ? 0 : parseFloat(result.toFixed(2));
        } catch (error) {
          return cell;
        }
      })
    );


    return evaluatedFormula;
  }

  private async calculateFinalAnswerForOtherType(answers: any, formula: string): Promise<any> {
    const getValue = (questionId: number): string => {
      const relevantAnswer = answers.find((a: any) => a.questionId === questionId);
      if (!relevantAnswer) return '0';

      return relevantAnswer.answer;
    };

    const replacedFormula = formula.replace(/Q(\d+)/g, (_, qId) => {
      const value = getValue(parseInt(qId));
      return isNaN(Number(value)) ? `"${value}"` : value;
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

  private async calculateFinalTrendsAnswer(answers: any, formula: string): Promise<any> {
    if (!formula) {
      return 0;
    }

    const getValue = (questionId: number): number => {
      const relevantAnswers = answers.filter((a: any) => a.questionId === questionId);
      if (relevantAnswers.length === 0) return 0;

      let sum = 0;

      relevantAnswers.forEach((answer: any) => {
        let parsedAnswer;

        try {
          parsedAnswer = JSON.parse(answer.answer);
        } catch (error) {
          console.error(`Failed to parse answer: ${answer.answer}`, error);
          return;
        }

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



  async isDuplicateArray(arr1: any, arr2: any) {
    if (arr1.length !== arr2.length) return false;
    return arr1.every(item => arr2.includes(item));
  }
  async getAssignedQuestion(req: any) {
    const systemUserId = req.headers.userid;
    const companyId = (await this.userDaoService.getCompanyDetailsBasedOnUserId(+systemUserId))?.company_id;

    if (!companyId) {
      throw new HttpException('SESSION_EXPIRED', HttpStatus.NOT_FOUND);
    }

    const financialYears = await this.superAdminClientService.getFinancialYears(companyId);
    financialYears.sort((a, b) => b.financial_year_value.localeCompare(a.financial_year_value));

    if (!financialYears?.length || financialYears.length < 1) {
      throw new HttpException('No active subscription found', HttpStatus.NOT_FOUND);
    }

    const userId = req?.query?.userId ?? systemUserId;
    const userDetails = await this.userDaoService.getCompanyDetailsBasedOnUserId(+userId);
    if (!userDetails) {
      throw new HttpException('User Not Found', HttpStatus.NOT_FOUND);
    }

    const financialYearId = req.query.financialYearId ? req.query.financialYearId : financialYears[0].id;
    const assignedDetails = await this.sectorQuestionDaoModuleService.getAssignedDetailsBasedOnAssignTo(Number(userId), {}, Number(financialYearId))
    if (assignedDetails) {
      return  { status: 200, message: 'Data Found', data: assignedDetails };
    }
    return {status: 200, message: 'No Assigned Questions Found', data: []};
  }

  async getViewQuestions(req: any) {
    const systemUserId = req.headers.userid;
    const financialYearId = req.query.financialYearId ? req.query.financialYearId : 6;
    if (systemUserId && systemUserId !== null) {
      const assignedQuestions = await this.sectorQuestionDaoModuleService.getQuestionIds([Number(systemUserId)], Number(financialYearId))
      if (assignedQuestions) {
        throw new HttpException(
          { status: 200, message: 'Data Found', data: assignedQuestions },
          HttpStatus.OK,
        );
      }
    }
  }

  async getCompanyQuestionsCategoryWise(req: any) {
    const systemUserId = req.headers.userid;
    const { financialYearId } = req.query;
    const getCompany = await this.userDaoService.getHeadOfficeCompanyDetails(true);
    if (systemUserId && systemUserId !== null) {
      const frameworkIds = await this.getFrameworkIds(getCompany.company_id);
      const queryParam = {
        company_id: getCompany.company_id,
        user_type_code: 'COMPANY',
        framework_ids: frameworkIds,
        qIds: getCompany.parent_id ? await this.sectorQuestionDaoModuleService.getQuestionIds([Number(systemUserId)], 6) : undefined,
      };

      const getSectorQuestionResponse = await this.externalApiCallService.getReq(
        process.env.COMPANY_SERVER_API_URL + 'getReportingQuestion',
        queryParam,
        {},
      );

      if (getSectorQuestionResponse['data'].length) {
        const totalQuestions = getSectorQuestionResponse['data'];
        const groupedData = {};
        totalQuestions.forEach(item => {
          const questionType = item.questionType;
          if (!groupedData[questionType]) {
            groupedData[questionType] = { totalQuestion: [] };
          }
          groupedData[questionType].totalQuestion.push(item.questionId);
        });
        const assignedQuestions = await this.sectorQuestionDaoModuleService.getQuestionIdsBasedOnSourceIdsForHead(Number(6));
        Object.keys(groupedData).forEach(questionType => {
          const totalQuestion = groupedData[questionType].totalQuestion;
          groupedData[questionType].assignedQuestion = totalQuestion.filter(id => assignedQuestions.includes(id));
          groupedData[questionType].unassignedQuestion = totalQuestion.filter(id => !assignedQuestions.includes(id));
        });
        if (groupedData) {
          throw new HttpException({ status: 200, message: 'Data Found', data: groupedData }, HttpStatus.OK);
        }
      } else {
        throw new HttpException({ status: 200, message: 'No Data Found', data: [] }, HttpStatus.OK);
      }
    }
  }

  async assignedQuestionToUser(assignQuestionDto: AssignQuestionDto, req: any) {
    const systemUserId = req.headers.userid;
    const companyId = (await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId)).company_id;

    const allAssignedMessages: string[] = [];
    const notificationMessages: { message: string; userId: number; questionIds: number[] }[] = [];

    for (const questionId of assignQuestionDto.questionIds) {
      const existingAssignment = await this.sectorQuestionDaoModuleService.getAssignmentByQuestionAndUser(
        questionId,
        systemUserId,
        Number(assignQuestionDto.financialYearId)
      );

      const [year, month, day] = assignQuestionDto.dueDate.split('-');
      const formattedDate = new Date(Number(year), Number(month) - 1, Number(day), 23, 59, 59);

      const subUserIds = await this.subUserDaoService.getAllSubUser(existingAssignment?.assignedTo || []);
      const assignedToIds = [
        ...new Set([
          ...assignQuestionDto.assignedToIds.map(Number), // Ensure each assignedToId is a number
          ...subUserIds.map((user) => Number(user.id)), // Ensure user.id is a number
        ]),
      ];

      let viewQuestion: number[] = [];

      if (existingAssignment?.viewQuestion) {
        viewQuestion = existingAssignment.viewQuestion.concat(assignQuestionDto.assignedToIds);
      } else {
        viewQuestion = [...assignedToIds];
      }

      // Ensure uniqueness and convert to numbers
      const onlyNumbersArray = [...new Set(viewQuestion)].map((item) =>
        typeof item === 'string' ? Number(item) : item
      );

      if (existingAssignment) {
        // Update existing assignment
        existingAssignment.assignedTo = assignedToIds;
        existingAssignment.viewQuestion = onlyNumbersArray;
        existingAssignment.dueDate = formattedDate;
        // existingAssignment.isReassigned = true;
        // existingAssignment.lastUpdatedBy = systemUserId;

        await this.sectorQuestionDaoModuleService.updateAssignQuestion(existingAssignment.id, existingAssignment);
      } else {
        // Create new assignment
        const assignedQuestionData: AssignQuestionEntity = new AssignQuestionEntity(
          assignQuestionDto.financialYearId,
          assignQuestionDto.moduleType as ModuleType,
          assignQuestionDto.questionnaireType as QuestionnaireType,
          assignQuestionDto.assignedToIds,
          systemUserId,
          [],
          questionId,
          onlyNumbersArray,
          true,
          companyId,
          formattedDate,
          false,
          true
        );

        await this.sectorQuestionDaoModuleService.createAssign(assignedQuestionData);
      }

      // Build notification messages
      for (let userId of assignQuestionDto.assignedToIds) {
        const existingNotificationIndex = notificationMessages.findIndex((item) => item.userId === userId);
        if (existingNotificationIndex !== -1) {
          notificationMessages[existingNotificationIndex].message = `${parseInt(notificationMessages[existingNotificationIndex].message, 10) + 1} New Questions Assigned`;
          notificationMessages[existingNotificationIndex].questionIds.push(questionId);
        } else {
          notificationMessages.push({
            message: '1 New Questions Assigned',
            userId: userId,
            questionIds: [questionId],
          });
        }
      }

      allAssignedMessages.push(` ${questionId} `);
    }

    // Send notifications if any
    if (allAssignedMessages.length > 0) {
      for (let data of notificationMessages) {
        if (Number(data?.userId) !== Number(systemUserId)) {
          const eventName = `notification${data?.userId}`;
          this.socketService.sendNotificationToUser(String(data?.userId), eventName, data.message);
          await this.userDaoService.insertNewNotification(
            new UserNotificationEntity(data.message, data.questionIds, Number(data?.userId), systemUserId)
          );
        }
      }

      throw new HttpException(
        { status: 200, message: "Question Assigned" },
        HttpStatus.OK
      );
    }
  }

  async sendReminderEmails(emailReminderDto: EmailReminderDto, req: any) {
    const { emailAddresses, message, questionIds } = emailReminderDto;
    const systemUserId = req.headers.userid;
    const getCompany = await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId);

    if (!getCompany.email) {
      throw new HttpException({ message: 'Email send failed, email is missing !!' }, HttpStatus.BAD_REQUEST);
    }

    const frameworkIds = (await this.externalApiCallService.getReq(
      process.env.COMPANY_SERVER_API_URL + 'getFramework',
      { companyId: getCompany.company_id, type: 'ALL', user_type_code: 'company' },
      {},
    )).data.map((obj) => obj.id)

    const queryParam = {
      company_id: getCompany.company_id,
      user_type_code: 'COMPANY',
      framework_ids: frameworkIds,
      qIds: questionIds,
    };

    const getReportingQuestion = await this.externalApiCallService.getReq(
      process.env.COMPANY_SERVER_API_URL + 'getReportingQuestion',
      queryParam,
      {},
    );
    const mainQuestions = getReportingQuestion.data;


    // Prepare question information for the email
    const questionTitles = mainQuestions.map(q => q.title);

    // Send emails to all addresses
    const emailPromises = emailAddresses.map(async (email) => {
      const userInformation = {
        email: email,
        name: 'User',
      };
      const payload = {
        emailData: {
          userDetails: userInformation,
          templatePath: '/../../../public/views/templates/reminder-question.html',
          subject: 'Welcome to RIU',
          url: questionTitles,
          password: message,
        },
      };

      const emailHistory = await this.userDaoService.insertNewEmailHistory(
        userInformation.email,
        'REMINDER_QUESTION',
        false,
        payload
      );

      const emailStatus = await this.sendMailService.sendingMail(
        userInformation,
        '/../../../public/views/templates/reminder-question.html',
        'Welcome to RIU',
        questionTitles,
        message
      );

      await this.userDaoService.updateStatusEmailHistory(
        emailHistory.id,
        emailStatus
      );

    });
    throw new HttpException({ message: 'Email Send Successfully !!' }, HttpStatus.OK);
  }

  async addRow(body: AddRowSectorQuestionDto, req: any) {
    const systemUserId = req.headers.userid;
    const { question_id, row_value, type } = body;
    let arr = [];
    let obj1 = new SectorQuestionDetailsEntity(question_id, type, row_value, '', systemUserId);
    arr.push(obj1);
    await this.sectorQuestionDaoService.createSectorQuestionDetails(arr);
    throw new HttpException({ status: 200, message: 'Added successfully', }, HttpStatus.OK);
  }

  async ReassignedQuestionToUser(assignQuestionDto: ReAssignQuestionDto, req: any) {
    const systemUserId = Number(req.headers.userid);
    const allAssignedMessages: string[] = [];
    const notificationMessages: { message: string; userId: number; questionIds: number[] }[] = [];

    const reAssignedToIds = assignQuestionDto.reAssignedToIds.map(Number);
    const assignedToIdsInput = assignQuestionDto.assignedToIds.map(Number);

    for (const questionId of assignQuestionDto.questionIds) {
      const existingAssignment = await this.sectorQuestionDaoModuleService.getAssignDetailsBasedOnQuestionId(
        questionId,
        Number(assignQuestionDto.financialYearId)
      );

      const [day, month, year] = assignQuestionDto.dueDate.split('-');
      const formattedDate = new Date(Number(year), Number(month) - 1, Number(day), 23, 59, 59);

      const subUserIds = await this.subUserDaoService.getAllSubUser(existingAssignment?.assignedTo || []);
      const subUserIdNumbers = subUserIds.map((user) => Number(user.id));

      // Merge and deduplicate assignedToIds
      let assignedToIds = [...new Set([...assignedToIdsInput, ...subUserIdNumbers])];

      // Remove re-assigned users
      assignedToIds = assignedToIds.filter((id) => !reAssignedToIds.includes(id));

      // Prepare viewQuestion array
      let viewQuestion: number[] = existingAssignment?.viewQuestion
        ? existingAssignment.viewQuestion.concat(assignedToIdsInput)
        : [...assignedToIds];

      // Filter out re-assigned users from viewQuestion
      viewQuestion = viewQuestion.filter((id) => !reAssignedToIds.includes(id));

      // Ensure viewQuestion has unique numbers
      const onlyNumbersArray = [...new Set(viewQuestion)].map((id) => Number(id));

      if (existingAssignment) {
        // Update assignment
        existingAssignment.assignedTo = assignedToIds;
        existingAssignment.viewQuestion = onlyNumbersArray;
        existingAssignment.dueDate = formattedDate;
        // existingAssignment.isReassigned = true;
        // existingAssignment.lastUpdatedBy = systemUserId;

        await this.sectorQuestionDaoModuleService.updateAssignQuestion(existingAssignment.id, existingAssignment);
      }

      // Build notification messages
      for (const userId of assignedToIdsInput) {
        const numericUserId = Number(userId);
        const existingNotification = notificationMessages.find((item) => item.userId === numericUserId);
        if (existingNotification) {
          const count = parseInt(existingNotification.message, 10);
          existingNotification.message = `${count + 1} New Questions Assigned`;
          existingNotification.questionIds.push(questionId);
        } else {
          notificationMessages.push({
            message: '1 New Questions Assigned',
            userId: numericUserId,
            questionIds: [questionId],
          });
        }
      }

      allAssignedMessages.push(`${questionId}`);
    }

    if (allAssignedMessages.length > 0) {
      for (const data of notificationMessages) {
        if (data.userId !== systemUserId) {
          const eventName = `notification${data.userId}`;
          this.socketService.sendNotificationToUser(String(data.userId), eventName, data.message);
          await this.userDaoService.insertNewNotification(
            new UserNotificationEntity(data.message, data.questionIds, data.userId, systemUserId)
          );
        }
      }

      throw new HttpException(
        { status: 200, message: "Question Re-Assigned" },
        HttpStatus.OK
      );
    }
  }


  async getSectorQuestionAnswer(userId: any, financialYearId: number) {
    const answer: any[] = [];
    const companyId = (await this.userDaoService.getCompanyDetailsBasedOnUserId(userId)).company_id;
    let getSectorQuestionAnswer = await this.sectorQuestionDaoModuleService.getSectorQuestionAnswers(companyId, financialYearId);
    getSectorQuestionAnswer = getSectorQuestionAnswer.map(obj => {
      if (obj.proofDocument !== null && obj.proofDocument !== '') {
        try {
          obj.proofDocument = JSON.parse(obj.proofDocument);
        } catch (error) {
          console.error("Error parsing proofDocument:", error);
        }
      }
      return obj;
    });

    const getSectorQuestionTabularAnswer = await this.sectorQuestionDaoModuleService.getSectorQuestionTabularAnswers(companyId, financialYearId);
    const tabularAnswerObject: Record<string, any[]> = {};

    getSectorQuestionTabularAnswer.forEach((answer) => {
      tabularAnswerObject[answer.questionId] = tabularAnswerObject[answer.questionId] || [];
      tabularAnswerObject[answer.questionId].push({
        notApplicable: answer?.notApplicable,
        performed: answer?.performed,
        note: answer?.note,
        audit_status: answer?.status,
        auditedDate: answer?.auditedDate,
        auditedRemark: answer?.auditedRemark,
        auditorEmail: answer?.auditorEmail,
        auditorName: answer?.auditorFirstName + " " + answer?.auditorLastName,
        answer: JSON.parse(answer?.answer),
        proofDocument: answer?.proofDocument,
        id: answer.id,
        userId: userId,
        audit_remark: answer.remark,
        sourceId: answer?.sourceId,
        answeredDate: answer?.updatedAt
      });
    });

    Object.keys(tabularAnswerObject).forEach((questionId) => {
      const answerObj = {
        questionId: +questionId,
        questionType: 'tabular_question',
        combinedAnswers: tabularAnswerObject[questionId],
        questionnaireType: 'CA',
        notApplicable: tabularAnswerObject[questionId][0]['notApplicable'],
        performed: tabularAnswerObject[questionId][0]['performed'],
        note: tabularAnswerObject[questionId][0]['note'],
        status: tabularAnswerObject[questionId][0]['audit_status'],
        id: tabularAnswerObject[questionId][0]['id'],
        answeredDate: tabularAnswerObject[questionId][0]['answeredDate'],
        auditedDate: tabularAnswerObject[questionId][0]['auditedDate'],
        auditedRemark: tabularAnswerObject[questionId][0]['auditedRemark'],
        auditorEmail: tabularAnswerObject[questionId][0]['auditorEmail'],
        auditorName: tabularAnswerObject[questionId][0]['auditorName'],
        answer: Array.from({ length: tabularAnswerObject[questionId][0]['answer']?.length || 0 }, () => Array.from({ length: tabularAnswerObject[questionId][0]['answer']?.[0]?.length || 0 }, () => '')),
      };
      answer.push(answerObj);
    });

    const getSectorQuestionTrendsAnswer = await this.sectorQuestionDaoModuleService.getSectorQuestionTrendsAnswers(companyId, financialYearId);
    const trendsArrayObect: Record<string, any[]> = {};

    getSectorQuestionTrendsAnswer.forEach((trendAnswer) => {
      trendsArrayObect[trendAnswer?.questionId] = trendsArrayObect[trendAnswer?.questionId] || [];
      const answer = (JSON.parse(trendAnswer.answer));
      answer['reading_value'] = trendAnswer['reading_value'];
      answer['audit_status'] = trendAnswer['status'];
      answer['auditedDate'] = trendAnswer['auditedDate'];
      answer['auditedRemark'] = trendAnswer['auditedRemark'];
      answer['auditorEmail'] = trendAnswer['auditorEmail'];
      answer['auditorName'] = trendAnswer['auditorFirstName'] + " " + trendAnswer['auditorLastName'];
      answer['answered_by_email'] = trendAnswer['answered_by_email'];
      answer['userId'] = trendAnswer['userId'];
      answer['answeredDate'] = trendAnswer['updatedAt'];
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
        readingValue: trendsArrayObect[questionId][0]['reading_value'],
        answeredDate: trendsArrayObect[questionId][0]['answeredDate'],
        auditedDate: trendsArrayObect[questionId][0]['auditedDate'],
        auditedRemark: trendsArrayObect[questionId][0]['auditedRemark'],
        auditorEmail: trendsArrayObect[questionId][0]['auditorEmail'],
        auditorName: trendsArrayObect[questionId][0]['auditorName'],
      };
      answer.push(answerObj);
    });
    answer.push(...getSectorQuestionAnswer);
    return answer;
  }

  async requestDueDate(requestDueDateDto: RequestDueDateDto, req: any) {
    const systemUserId = req.headers.userid;
    const { id } = await this.userDaoService.getCompanyDetailsBasedOnParentIdNull();
    const updateDueDateStatus = await this.sectorQuestionDaoModuleService.dueDateRequested(requestDueDateDto.questionId, true, id);
    const eventName = `notification${id}`;
    const message = "Change Due Date";
    this.socketService.sendNotificationToUser(String(id), eventName, message);
    await this.userDaoService.insertNewNotification(new UserNotificationEntity(message, [requestDueDateDto.questionId], Number(id), systemUserId));
    throw new HttpException({ status: 200, message: 'Succesfully Send Request To Company Admin' }, HttpStatus.OK);
  }

  async extractUrls(arr: any): Promise<string[]> {
    if (!Array.isArray(arr)) {
      return [];
    }

    let urls: string[] = [];

    for (const item of arr) {
      if (Array.isArray(item)) {
        const nestedUrls = await this.extractUrls(item);
        urls = urls.concat(nestedUrls);
      } else if (typeof item === 'string') {
        urls = urls.concat(item.split(','));
      }
    }

    return urls;
  }

  async updateDueDate(updateDueDateDto: UpdateDueDateDto, req: any) {
    const systemUserId = req.headers.userid;
    const userId = 2;
    const [day, month, year] = updateDueDateDto.dueDate.split('-');
    const formattedDate = new Date(Number(year), Number(month) - 1, Number(day), 23, 59, 59);
    const dueDate = await this.sectorQuestionDaoModuleService.updateDueDate(updateDueDateDto.questionId, formattedDate);
    const { id } = await this.userDaoService.getCompanyDetailsBasedOnParentIdNull();
    const updateDueDateStatus = await this.sectorQuestionDaoModuleService.dueDateRequested(updateDueDateDto.questionId, false, id);
    const eventName = `notification${userId}`;
    const message = "Updated Due Date";
    this.socketService.sendNotificationToUser(String(userId), eventName, message);
    await this.userDaoService.insertNewNotification(new UserNotificationEntity(message, [updateDueDateDto.questionId], Number(userId), systemUserId));
    throw new HttpException({ status: 200, message: 'Due Date Updated' }, HttpStatus.OK);
  }

  async reminderToUser(reminderUserDto: ReminderUserDto, req: any): Promise<any> {
    const systemUserId = req.headers.userid;
    const getAssignmentByCurrentAnswerableIds = await this.sectorQuestionDaoModuleService.getAssignmentByCurrentAnswerable(reminderUserDto.questionId, true);
    const assignedTo = getAssignmentByCurrentAnswerableIds?.assignedTo;
    if (assignedTo && Array.isArray(assignedTo) && assignedTo.length > 0) {
      for (const item of assignedTo) {
        const eventName = `notification${Number(item)}`;
        const message = 'Reminder Due Date';
        this.socketService.sendNotificationToUser(String(item), eventName, message);
        await this.userDaoService.insertNewNotification(
          new UserNotificationEntity(message, [reminderUserDto.questionId], Number(item), systemUserId),
        );
      }
      return { status: HttpStatus.OK, message: 'Successfully Sent Reminder' };
    } else {
      throw new HttpException({ status: HttpStatus.NOT_FOUND, message: 'No assignments found' }, HttpStatus.NOT_FOUND);
    }
  }

  async saveAnswerSectorQuestion(saveAnswerQuestionDto: SaveAnswerQuestionDto, req: any) {
    const systemUserId = req.headers.userid;
    const parentId = ((await this.subUserDaoService.getSubUserBasedOnCompanyId(Number(systemUserId)))?.parentId);
    const companyId = (await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId)).company_id;
    const headOfficeId = (await this.sourceDaoService.getHeadOffice()).id;
    for (const item of saveAnswerQuestionDto.data) {
      const questionType = item.questionType as QuestionType;
      const questionnaireType: QuestionnaireType = 'CA' as QuestionnaireType;
      const status: QuestionStatus = 'ANSWERED' as QuestionStatus;
      const financialYearId = saveAnswerQuestionDto?.financialYearId;

      const assignedDetails = await this.sectorQuestionDaoModuleService.getAssignDetailsBasedOnQuestionIdAndAssignedToId(systemUserId, item.questionId, financialYearId);
      const assignedByUserDetails = await this.userDaoService.getCompanyDetailsBasedOnUserId(assignedDetails.assignedBy);
      const auditorId = !parentId ? assignedByUserDetails.id : parentId;
      if (item.questionType === 'qualitative' ||
        item.questionType === 'yes_no' ||
        item.questionType === 'quantitative') {
        const existingRecord = await this.sectorQuestionDaoModuleService.getExistingRecordAnswer(item.questionId, financialYearId);
        if (existingRecord) {
          const historyEntity = this.createAnswerHistoryEntity(existingRecord, questionnaireType);
          await this.sectorQuestionDaoModuleService.saveSectorQuestionHistoryAnswer(historyEntity);
          const answerEntity = this.createAnswerEntity(systemUserId, item, financialYearId, headOfficeId, companyId, questionnaireType, status);
          await this.sectorQuestionDaoModuleService.updateSectorQuestionAnswer(item.questionId, Number(financialYearId), answerEntity);
        } else if (existingRecord === null) {
          const answerEntity = this.createAnswerEntity(systemUserId, item, financialYearId, headOfficeId, companyId, questionnaireType, status);
          const insertAnswer = await this.sectorQuestionDaoModuleService.saveSectorQuestionAnswer(answerEntity);
          await this.auditListingDaoService.insertAuditData(new AuditListingEntity(
            questionType as QuestionType, companyId, saveAnswerQuestionDto.financialYearId,
            item.questionId, questionnaireType, insertAnswer.id, auditorId, [auditorId, assignedDetails?.assignedBy, systemUserId], status,
          ));
          const massage = `${item?.title}`
          await this.dashboardDaoService.insertTodaysActivityData(new TodaysActivity(massage, "Answered", systemUserId, item.questionId));
        }
      } else if (item.questionType === 'quantitative_trends') {
        const answerArray = Array.isArray(item.answer) ? item.answer : [item.answer];
        for (const trends of answerArray) {
          const existingRecord = await this.sectorQuestionDaoModuleService.getExistingRecordTrendsAnswer(item.questionId, `${trends["from_date"]}-${trends["to_date"]}-${trends["meter_id"]}`, financialYearId);
          if (existingRecord) {
            const historyEntity = this.createTrendsHistoryEntity(existingRecord, questionnaireType);
            await this.sectorQuestionDaoModuleService.saveSectorQuestionTrendsHistoryAnswer(historyEntity);
            const answerEntity = this.createTrendsAnswerEntity(systemUserId, item, trends, financialYearId, companyId, questionnaireType, status);
            await this.sectorQuestionDaoModuleService.updateSectorQuestionTrendsAnswer(item.questionId, `${trends["from_date"]}-${trends["to_date"]}-${trends["meter_id"]}`, answerEntity);
            await this.processDaoService.updateDeletable(trends["process"]);
          } else if (existingRecord === null) {
            const answerEntity = this.createTrendsAnswerEntity(systemUserId, item, trends, financialYearId, companyId, questionnaireType, status);
            const insertAnswer = await this.sectorQuestionDaoModuleService.saveSectorQuestionTrendsAnswer(answerEntity);
            await this.auditListingDaoService.insertAuditData(new AuditListingEntity(
              questionType as QuestionType, companyId, saveAnswerQuestionDto.financialYearId,
              item.questionId, questionnaireType, insertAnswer.id, auditorId, [auditorId, assignedDetails?.assignedBy, systemUserId], status,
            ));
            const massage = `${item?.title}`
            await this.dashboardDaoService.insertTodaysActivityData(new TodaysActivity(massage, "Answered", systemUserId, item.questionId));
          }
        }
      } else if (item.questionType === 'tabular_question') {
        const existingRecord = await this.sectorQuestionDaoModuleService.getExistingRecordTabularAnswer(item.questionId, item.source_id, financialYearId);
        if (existingRecord) {
          const historyEntity = this.createTabularHistoryEntity(existingRecord, questionnaireType);
          await this.sectorQuestionDaoModuleService.saveSectorQuestionTabularHistoryAnswer(historyEntity);
          const answerEntity = this.createTabularAnswerEntity(systemUserId, item, financialYearId, companyId, questionnaireType, status);
          await this.sectorQuestionDaoModuleService.updateSectorQuestionTabularAnswer(item.questionId, Number(item.source_id), Number(financialYearId), answerEntity);
        } else if (existingRecord === null) {
          const answerEntity = this.createTabularAnswerEntity(systemUserId, item, financialYearId, companyId, questionnaireType, status);
          const insertAnswer = await this.sectorQuestionDaoModuleService.saveSectorQuestionTabularAnswer(answerEntity);
          await this.auditListingDaoService.insertAuditData(new AuditListingEntity(
            questionType as QuestionType, companyId, saveAnswerQuestionDto.financialYearId,
            item.questionId, questionnaireType, insertAnswer.id, auditorId, [auditorId, assignedDetails?.assignedBy, systemUserId], status,
          ));
          const massage = `${item?.title}`
          await this.dashboardDaoService.insertTodaysActivityData(new TodaysActivity(massage, "Answered", systemUserId, item.questionId));

        }
      }
    }
    const answer = await this.getSectorQuestionAnswer(systemUserId, saveAnswerQuestionDto?.financialYearId);
    throw new HttpException({ status: 200, message: 'Answer Saved', answers: answer }, HttpStatus.OK);
  }

async getAssignedDetails(req: any) {
  const systemUserId = req.headers.userid;
  const financialYearId = req.query.financialYearId;

  const getAssignedDetails =
    await this.sectorQuestionDaoModuleService.getAssignedDetailsBasedOnAssignedBy(
      Number(financialYearId),
    );

  const getUsers = await this.userDaoService.getUsers(true);

  // fast lookup
  const usersById: Map<string, any> = new Map(
    getUsers.map((u: any) => [String(u.id), u]),
  );

  for (const item of getAssignedDetails) {
    // normalize assignedTo => array of strings
    const assignedToIds: string[] = Array.isArray(item.assignedTo)
      ? item.assignedTo.map(String)
      : item.assignedTo
      ? [String(item.assignedTo)]
      : [];

    // assignedToDetails preserving order
    const assignedToDetails = assignedToIds
      .map((id) => usersById.get(id))
      .filter(Boolean);

    // assignedByDetails (single user expected but keep array)
    const assignedByUser =
      item.assignedBy != null
        ? usersById.get(String(item.assignedBy))
        : undefined;
    const assignedByDetails = assignedByUser ? [assignedByUser] : [];

    
    Object.assign(item, {
      assignedByDetails,
      assignedToDetails,
  
    });
  }

  if (getAssignedDetails.length > 0) {
    throw new HttpException(
      { status: 200, assignedDetails: getAssignedDetails },
      HttpStatus.OK,
    );
  }
}


  private getYesNoTypeValue(item) {
    if (item?.notApplicable === 1) {
      return {
        title: item.title,
        value: 'Not Applicable'
      };
    }

    let parsedAnswer = { answer: item.answer, details: "", weblink: "" };
    try {
      parsedAnswer = JSON.parse(item.answer);
    } catch (e) {
      console.error("Failed to parse answer:", item);
    }

    const { answer: yesNoAnswer, details = "" } = parsedAnswer;

    const trimDetails = (text) => (
      text.replace(/^yes\.?\s*/i, "").replace(/^no\.?\s*/i, "").trim()
    );

    const capitalizeFirst = (text = "") => (
      text.charAt(0).toUpperCase() + text.slice(1)
    );

    return {
      item: item,
      notApplicable: String(item?.notApplicable).toLowerCase() === "true",
      value: capitalizeFirst(yesNoAnswer),
      details: trimDetails(details),
      note: item.note
    }
  }

  private getQuantitativeTrendsTypeValue(item) {

    const formatOptionType = (optionType) => {
      // Convert the string from snake_case to Title Case
      return optionType
        .replace(/_/g, ' ')   // Replace underscores with spaces
        .replace(/\b\w/g, char => char.toUpperCase()); // Capitalize the first letter of each word
    }

    const readingValue = item?.answer;

    return {
      item: item,
      notApplicable: String(item?.notApplicable).toLowerCase() === "true",
      note: item.note,
      value: Array.isArray(item.answer) && item.answer.length > 0 ?
        item.answer.map((entry, index) => {
          const readingValueWithUnit = `${readingValue} ${entry?.unit}`;
          if (entry === 'No Combined') {
            return `No Answer - Reading Value: ${readingValueWithUnit}`;
          }
          return readingValueWithUnit;
        }) :
        `${formatOptionType(item?.question_detail[0]?.option_type)} :  ${item.answer?.reading_value} ${item?.question_detail[0]?.option}`
    };
  };

  private getTabularQuestionTypeValue(item) {
    const rows =
      item?.question_detail?.filter((detail) => detail.option_type === "row") || [];
    const columns =
      item?.question_detail?.filter((detail) => detail.option_type === "column") || [];

    const resultMatrix = rows.map((_, rowIndex) =>
      columns.map((_, colIndex) => {
        try {
          const cellText =
            item.combinedAnswers !== "No Combined" &&
              item.combinedAnswers[0]?.answer?.[rowIndex]?.[colIndex] !== undefined
              ? item.combinedAnswers[0]?.answer[rowIndex][colIndex]
              : "";
          return cellText;
        } catch (error) {
          console.error("Failed to parse tabular question:", item);
          throw error;
        }
      })
    );

    return {
      item: item,
      notApplicable: String(item?.notApplicable).toLowerCase() === "true",
      value: resultMatrix,
      note: item.note
    };
  };

  private getQuestionValue(item) {
    switch (item.questionType) {
      case 'qualitative':
        try {
          return {
            item: item,
            notApplicable: String(item?.notApplicable).toLowerCase() === "true",
            value: JSON.parse(item.answer),
            note: item.note
          };
        } catch (error) {
          return {
            item: item,
            notApplicable: String(item?.notApplicable).toLowerCase() === "true",
            value: item.answer,
            note: item.note
          };
        }
      case 'tabular_question':
        return this.getTabularQuestionTypeValue(item);
      case 'quantitative':
        try {
          return {
            item: item,
            notApplicable: String(item?.notApplicable).toLowerCase() === "true",
            value: JSON.parse(item.answer),
            note: item.note
          };
        } catch (error) {
          return {
            item: item,
            notApplicable: String(item?.notApplicable).toLowerCase() === "true",
            value: item.answer,
            note: item.note
          };
        }
      case 'yes_no':
        return this.getYesNoTypeValue(item);
      case 'quantitative_trends':
        return this.getQuantitativeTrendsTypeValue(item);
      default:
        return {
          item: item
        };
    }
  };


  async generatePdf(htmlContent: string, title: string, logoBase64: string, currentFinancialYear: string) {
    const browser = await puppeteer.launch({
      args: ['--no-sandbox'],
      headless: true,
    });
    const [page] = await browser.pages();

    await page.setContent(htmlContent);
    const pdfBuffer = await page.pdf({
      format: 'A4',
      displayHeaderFooter: true,
      margin: {
        top: '100px',
        bottom: '80px',
        left: '40px',
        right: '40px'
      },
      headerTemplate: `
        <div style="font-family: Arial, sans-serif; font-size: 13px; line-height: 1.3; color: #000000; padding: 0px 40px 0px 40px; margin: 20px 0px 20px auto;">
            <table style="border-collapse: collapse;">
                <tr>
                    <td style="vertical-align: middle; padding-right: 10px; height: 30px;">
                        <div style="color: #666; font-size: 11px;">${title}</div>
                    </td>
                    <td style="vertical-align: middle;">
                        <img src="${logoBase64}" alt="${title}" style="height: 30px;">
                    </td>
                </tr>
            </table>
        </div>
      `,
      footerTemplate: `
        <span style="width: 530px; border-top:5px solid #ffcc00; font-family: Arial, sans-serif; font-size: 9px; font-weight: bold; line-height: 1.3; margin-top: auto; position: fixed; left: 35px;">
          <table style="border-collapsed: collapsed; margin-top:10px">  
            <tr>
              <td style="width: 265px; text-align: left;">
                  Annual Report FY ${currentFinancialYear}
              </td>
              <td class="pageNumber" style="width: 265px; text-align: right;"></td>
            </tr>
          </table>
        </span>
      `
    });

    if (!pdfBuffer) {
      console.error('Invalid file:', pdfBuffer);
      throw new Error('Invalid file.');
    }

    await browser.close();

    return pdfBuffer;
  }

  async generateDocx(htmlContent: string, title: string, logoBase64: string, currentFinancialYear: string) {

    // Header and footer HTML
    const headerTemplate = `
      <div style="font-family: Arial, sans-serif; font-size: 13px; line-height: 1.3; color: #000000; padding: 0px 40px 0px 40px; margin: 20px 0px 20px auto;">
        <table style="border-collapse: collapse;">
            <tr>
                <td style="vertical-align: middle; padding-right: 10px; height: 30px;">
                    <div style="color: #666; font-size: 11px;">${title}</div>
                </td>
                <td style="vertical-align: middle;">
                    <img src="${logoBase64}" alt="${title}" style="height: 30px;">
                </td>
            </tr>
        </table>
      </div>
    `;

    const footerTemplate = `
      <div style="border-top:5px solid #ffcc00; font-family: Arial, sans-serif; font-size: 9px; font-weight: bold; line-height: 1.3; margin-top: auto; position: fixed; left: 40px; right: 40px">
        <table style="border-collapsed: collapsed;">  
          <tr>
            <td style="width: 50%; text-align: left;">
                Annual Report FY ${currentFinancialYear}
            </td>
            <td class="pageNumber" style="width: 50%; text-align: right;"></td>
          </tr>
        </table>
      </div>
    `;

    // Convert HTML to .docx
    const buffer = await HTMLtoDOCX(htmlContent, null, {
      table: { row: { cantSplit: true } },
      footerTemplate,
      headerTemplate,
      pageNumber: true,
      margins: {
        top: 720,
        bottom: 720,
        left: 720,
        right: 720
      },
      font: 'Arial',
    });

    return buffer;
  }

  async generateReport(req: any, body: GenerateReportRequestDto): Promise<GenerateReportResponseDto> {
    const { frameworkId, financialYearId, reportType } = body;

    const companyData = await this.userDaoService.getHeadOfficeCompanyDetails(true);

    const supportedFrameworks = await this.superAdminClientService.getFrameworkIds(companyData.company_id);
    if (!supportedFrameworks.includes(frameworkId)) {
      throw new HttpException('Unsupported Framework', HttpStatus.BAD_REQUEST);
    }

    const supportedFinancialYears = await this.superAdminClientService.getFinancialYears(companyData.company_id);
    const supportedFinancialYearIds = supportedFinancialYears.map(fy => fy.id);
    if (!supportedFinancialYearIds.includes(financialYearId)) {
      throw new HttpException('Unsupported Financial Year', HttpStatus.BAD_REQUEST);
    }

    const reportGenerationSettings = await this.sectorQuestionDaoModuleService.getReportGenerationSettingsForAFinancialYearAndFrameworkID(frameworkId, financialYearId);

    let companyName = companyData.register_company_name;

    let selectedTopicsIds = '[1, 41, 42, 45, 46, 47, 48, 49, 50, 51, 24, 28, 40, 44, 8, 18, 26, 32, 43, 2, 9]';
    let selectedKpiIds = [];

    if (!selectedTopicsIds.length) {
      throw new HttpException(
        { status: 400, data: [], message: "No topics selected!" },
        HttpStatus.BAD_REQUEST
      );
    }

    const queryParam = {
      companyId: companyData.company_id,
      type: 'CUSTOM',
      user_type_code: 'company',
      entity: 'company',
      framework_ids: `[${frameworkId}]`,
      topic_ids: selectedTopicsIds,
      kpi_ids: '[]',
      financial_year_id: 6,
      questionnaire_type: 'SQ',
      qIds: undefined,
    };
    const getSectorQuestion = await this.externalApiCallService.getReq(
      process.env.COMPANY_SERVER_API_URL + 'getSectorQuestion',
      queryParam,
      {},
    );

    let questionData = getSectorQuestion['data'];
    const answerData = await this.getSectorQuestionAnswer(1, Number(financialYearId));
    const questionIdMap = Object.values(answerData).reduce((acc, question) => {
      acc[question.questionId] = question;
      return acc;
    }, {});

    let jsonObj = {};
    questionData.forEach((question) => {
      const correspondingAnswer = questionIdMap[question.id] ? questionIdMap[question.id] : null;
      const item = {
        ...question,
        notApplicable: correspondingAnswer?.notApplicable,
        note: correspondingAnswer?.note,
        combinedAnswers: correspondingAnswer?.combinedAnswers || "No Combined",
        answer: question?.questionType === "quantitative_trends"
          ? (correspondingAnswer?.answer || "No Combined")
          : (correspondingAnswer?.answer || "No Answer"),
      };
      jsonObj[question.id] = this.getQuestionValue(item);
    });

    let mainJson = {};
    let topicIdToTopicNameMapping = {}; // New object for topicId to topic_name mapping

    Object.values(jsonObj).forEach((obj) => {
      const item = obj["item"];
      if (typeof item === 'object' && item !== null) {
        if (!mainJson[item["topicId"]]) {
          mainJson[item["topicId"]] = {};
        }
        if (!Object.keys(mainJson[item["topicId"]]).includes(item['heading'])) {
          mainJson[item["topicId"]][item["heading"]] = [];
        }

        mainJson[item["topicId"]][item["heading"]].push(obj);

        // Add topicId and topic_name to the new object
        topicIdToTopicNameMapping[item["topicId"]] = item["topic_name"];
      } else {
        console.log('obj skipped: ', typeof item, item);
      }
    });

    const sectorQuestionValueMap = {}
    Object.values(jsonObj).forEach(obj => {
      sectorQuestionValueMap[`SQ${obj['item']['id']}`] = obj;
    });

    fs.writeFileSync(
      path.join(__dirname, '/../../public/views/report/sector-question-answers.json'),
      JSON.stringify(sectorQuestionValueMap)
    )

    sectorQuestionValueMap['currentFinancialYear'] = supportedFinancialYears.find(fy => fy.id === financialYearId).financial_year_value;
    sectorQuestionValueMap['previousFinancialYear'] = this.getPreviousFinancialYear(sectorQuestionValueMap['currentFinancialYear']);
    sectorQuestionValueMap['previousToPreviousFinancialYear'] = this.getPreviousFinancialYear(sectorQuestionValueMap['previousFinancialYear']);

    let title: string | undefined;
    let companyLogoBase64: string | undefined;

    for (const setting of reportGenerationSettings as ReportGenerationSettingEntity[]) {
      if (setting.settingName === 'Show Leadership Indicators') {
        sectorQuestionValueMap['showLeadershipIndicators'] = setting.settingMetaAndAnswer['value'];
      } else if (setting.settingName === 'Company Title') {
        title = setting.settingMetaAndAnswer['value'] || companyData.register_company_name;
      } else if (setting.settingName === 'Company Logo') {
        // TODO: download image from URL and convert to base64 if needed
        try {
          companyLogoBase64 = await this.downloadImageAsDataUrl(setting.settingMetaAndAnswer['value']);
        } catch (error) {
          throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
      }
    }

    if (reportType === 'PDF' || reportType === 'DOCX') {
      let htmlContent: string;
      try {
        htmlContent = await ejs.renderFile(
          path.join(__dirname, '/../../public/views/report/brsr-report.ejs'),
          { ...sectorQuestionValueMap }
        );
      } catch (error) {
        console.error('Error rendering EJS file:', error);
        throw new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      let fileName = `BRSR_${title}_${sectorQuestionValueMap['currentFinancialYear']}_${Date.now()}`;
      let reportFileBuffer, contentType;
      if (reportType === 'PDF') {
        fileName = `${fileName}.pdf`;
        contentType = 'application/pdf';
        reportFileBuffer = await this.generatePdf(htmlContent, title, companyLogoBase64, sectorQuestionValueMap['currentFinancialYear']);
      } else if (reportType === 'DOCX') {
        fileName = `${fileName}.docx`;
        contentType = 'application/docx';
        reportFileBuffer = await this.generateDocx(htmlContent, title, companyLogoBase64, sectorQuestionValueMap['currentFinancialYear']);
      } else {
        throw new HttpException('Unsupported report type', HttpStatus.BAD_REQUEST);
      }

      const blockBlobClient = this.containerClient.getBlockBlobClient(fileName);
      await blockBlobClient.uploadData(reportFileBuffer, {
        blobHTTPHeaders: { blobContentType: contentType },
      });

      console.log("✅ File Uploaded Successfully to Azure:", blockBlobClient.url);
      return { ...body, reportUrl: blockBlobClient.url, message: 'Report generated successfully' };

    } else if (reportType === "EXCEL") {
      const singleAnswerQuestions: string[] = ["qualitative", "yes_no", "quantitative"];
      const workbook = new ExcelJS.Workbook();



      const topicIdsInMainJson: string[] = Object.keys(mainJson);
      const worksheet = workbook.addWorksheet("Index");

      worksheet.getCell('A1').value = "Index";
      worksheet.getCell('B1').value = "Topic Name";
      worksheet.getCell('C1').value = "Link";

      worksheet.getRow(1).eachCell({ includeEmpty: true }, (cell) => {
        cell.font = { bold: true };
        cell.fill = {
          type: "pattern" as const,
          pattern: "solid",
          fgColor: { argb: "33CCFF" },
        };
      });

      worksheet.mergeCells('A1:C1');

      topicIdsInMainJson.forEach((topicId, index) => {
        const topicName = topicIdToTopicNameMapping[topicId];
        worksheet.addRow([
          index + 1,
          topicName,
          {
            text: topicName,
            hyperlink: `#'${topicName}'!A1`,
          },
        ]);
      });

      worksheet.columns.forEach((column) => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, (cell) => {
          const columnLength = cell.value ? cell.value.toString().length : 10;
          if (columnLength > maxLength) {
            maxLength = columnLength;
          }
          cell.alignment = { wrapText: true };
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });
        column.width = Math.min(maxLength + 2, 40);  // Cap the width to prevent too wide columns
      });

      Object.keys(mainJson).forEach((topicId) => {
        const topicName = topicIdToTopicNameMapping[topicId];
        const worksheet = workbook.addWorksheet(topicName.replace(/[*?:\\/\[\]]/g, '_'));

        worksheet.getCell('A1').value = topicName;

        worksheet.getRow(1).eachCell({ includeEmpty: true }, (cell) => {
          cell.font = { bold: true };
          cell.fill = {
            type: "pattern" as const,
            pattern: "solid",
            fgColor: { argb: "33CCFF" },
          };
        });

        // Style rows
        const rowStyle: ExcelJS.Style = {
          font: { bold: true },
          fill: {
            type: "pattern" as const,
            pattern: "solid" as const,
            fgColor: { argb: "BFBFBF" },
          },
          alignment: { horizontal: "left", vertical: "top" }, // Default alignment
          border: {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          },
          numFmt: "General", // Default number format
          protection: {}, // Default protection
        };


        let sNo = 1;

        Object.keys(mainJson[topicId]).forEach((quesTitle) => {
          const titleRow = worksheet.addRow([quesTitle]);
          titleRow.eachCell({ includeEmpty: true }, (cell) => {
            let columnName = "";
            let columnNumber = Number(cell.col);
            while (columnNumber > 0) {
              const remainder = (columnNumber - 1) % 26;
              columnName = String.fromCharCode(65 + remainder) + columnName;
              columnNumber = Math.floor((columnNumber - 1) / 26);
            }
            const cellName = `${columnName}${cell.row}`;
            cell.style = rowStyle;
            cell.name = cellName;
          });

          const questions = mainJson[topicId][quesTitle];

          questions.forEach((questionDetail: any) => {
            try {
              if (singleAnswerQuestions.includes(questionDetail.questionType)) {
                const questionTitle = questionDetail.title;
                const answer = questionDetail.Answer as string;
                worksheet.addRow([`${sNo}. ${questionTitle}`, answer]);
                sNo++;
              }

              if (questionDetail.questionType === "tabular_question") {
                const tableQuestion = questionDetail.title;
                worksheet.addRow([`${sNo}. ${tableQuestion}`]);
                sNo++;

                const subHeading = questionDetail.sub_heading ? [...questionDetail.sub_heading] : [];
                let header = [{ name: " ", filterButton: false }];
                let rows = [];
                let answerRows = [];
                let rowCounter = 0;

                questionDetail.question_detail.forEach((detail) => {
                  if (detail.option_type === "row") {
                    rows.push(detail.option);
                    rowCounter++;
                  } else {
                    header.push({ name: detail.option, filterButton: false });
                  }
                });

                worksheet.addRow(subHeading);
                questionDetail.Answer.forEach((answerDetail, index) => {
                  let innerRow = [];
                  answerDetail.answer.forEach((ansRow: any[], rowIndex) => {
                    let rowData = [rows[rowIndex]];
                    for (let j = 0; j < header.length - 1; j++) {
                      try {
                        rowData.push(ansRow[j]);
                      } catch {
                        rowData.push("");
                      }
                    }
                    innerRow.push(rowData);
                  });

                  if (innerRow.length) {
                    if (questionDetail.Answer.length > 1) {
                      worksheet.addRow([`${sNo}.${index + 1}`]);
                    }
                    const range = worksheet.dimensions;
                    const lastRow = range.bottom;
                    worksheet.addTable({
                      name: `tabular_question_${sNo}_${index + 1}`,
                      ref: `B${lastRow + 1}`,
                      headerRow: true,
                      style: {
                        theme: "TableStyleMedium9",
                        showRowStripes: true,
                      },
                      columns: header,
                      rows: innerRow,
                    });

                    worksheet.getRow(lastRow + 1).eachCell((cell) => {
                      cell.font = { bold: true };
                      cell.fill = {
                        type: "pattern",
                        pattern: "solid",
                        fgColor: { argb: "BFBFBF" },
                      };
                    });
                  }
                });

                sNo++;
                worksheet.addRow([]);
              }

            } catch (error) {
              console.error(`Error processing question: ${questionDetail.title}`, error);
            }
          });
        });

        // Style columns for the topic worksheet
        worksheet.columns.forEach((column) => {
          let maxLength = 0;
          column.eachCell({ includeEmpty: true }, (cell) => {
            const columnLength = cell.value ? cell.value.toString().length : 10;
            if (columnLength > maxLength) {
              maxLength = columnLength;
            }
            cell.alignment = { wrapText: true };
            cell.border = {
              top: { style: "thin" },
              left: { style: "thin" },
              bottom: { style: "thin" },
              right: { style: "thin" },
            };
          });
          column.width = Math.min(maxLength + 2, 40);
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const fileName = `BRSR_${Date.now()}.xlsx`;
      const key = `riu/reports/${fileName}`;

      const uploadResponse = await this.s3.upload({
        Bucket: 'riu-bucket',
        Key: key,
        Body: buffer,
        ACL: 'public-read',
        ContentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // Correct ContentType for Excel
      }).promise();

      const url = uploadResponse.Location;
    } else if (true) {

      const singleAnswerQuestions = ["qualitative", "yes_no", "quantitative"];
      const topicIdsInMainJson = Object.keys(mainJson);

      // Function to escape special XML characters and remove invalid characters
      const sanitizeXml = (str: string) => {
        return str
          .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/'/g, '&apos;')
          .replace(/"/g, '&quot;');
      };

      // Initialize the XML root element
      const root = create({ version: '1.0', encoding: 'UTF-8' })
        .ele('xbrl');

      // Add index section
      const index = root.ele('Index');

      index.ele('Header')
        .ele('Index').txt('Index').up()
        .ele('TopicName').txt('Topic Name').up()
        .ele('Link').txt('Link').up()
        .up(); // Close Header

      // Add rows for each topic
      topicIdsInMainJson.forEach((topicId, idx) => {
        const topicName = topicIdToTopicNameMapping[topicId];
        index.ele('Row')
          .ele('Index').txt((idx + 1).toString()).up()
          .ele('TopicName').txt(sanitizeXml(topicName)).up()
          .ele('Link').txt(`#${sanitizeXml(topicName)}!A1`).up()
          .up(); // Close Row
      });

      // Add topics and questions
      topicIdsInMainJson.forEach((topicId) => {
        const topicName = topicIdToTopicNameMapping[topicId];
        const topicElement = root.ele('Topic', { id: topicId, name: sanitizeXml(topicName) });

        Object.keys(mainJson[topicId]).forEach((quesTitle) => {
          const questionsElement = topicElement.ele('Questions', { title: sanitizeXml(quesTitle) });

          const questions = mainJson[topicId][quesTitle];

          questions.forEach((questionDetail: any) => {
            try {
              if (singleAnswerQuestions.includes(questionDetail.questionType)) {
                questionsElement.ele('Question', { type: questionDetail.questionType })
                  .ele('Title').txt(sanitizeXml(questionDetail.title)).up()
                  .ele('Answer').txt(sanitizeXml(questionDetail.Answer)).up()
                  .up(); // Close Question
              }

              if (questionDetail.questionType === "tabular_question") {
                const tableQuestion = questionsElement.ele('TabularQuestion', { title: sanitizeXml(questionDetail.title) });

                const subHeading = questionDetail.sub_heading ? [...questionDetail.sub_heading] : [];
                tableQuestion.ele('SubHeading').txt(subHeading.map(sanitizeXml).join(', ')).up();

                questionDetail.question_detail.forEach((detail) => {
                  if (detail.option_type === "row") {
                    tableQuestion.ele('RowOption').txt(sanitizeXml(detail.option)).up();
                  } else {
                    tableQuestion.ele('ColumnOption').txt(sanitizeXml(detail.option)).up();
                  }
                });

                questionDetail.Answer.forEach((answerDetail: any, index: number) => {
                  const answerElement = tableQuestion.ele('Answer', { id: (index + 1).toString() });
                  answerDetail.answer.forEach((ansRow: any) => {
                    answerElement.ele('Row').txt(ansRow.map(sanitizeXml).join(', ')).up();
                  });
                });
              }

            } catch (error) {
              console.error(`Error processing question: ${questionDetail.title}`, error);
            }
          });
        });
      });

      const xbrlString = root.end({ prettyPrint: true });

      // Save or upload the XBRL file
      const fileName = `BRSR_${Date.now()}.xbrl`;
      const key = `riu/reports/${fileName}`;

      const uploadResponse = await this.s3.upload({
        Bucket: 'riu-bucket',
        Key: key,
        Body: xbrlString,
        ACL: 'public-read',
        ContentType: 'application/xml', // Correct ContentType for XBRL
      }).promise();
      throw new HttpException(
        { status: 200, data: uploadResponse.Location },
        HttpStatus.OK,
      );
      // return uploadResponse.Location;

    }
  }

  async getReportGenerationSettings(req: any): Promise<ReportGenerationSettingsDto> {
    const frameworkIds = JSON.parse(req.query.frameworkIds);
    const entities = await this.sectorQuestionDaoModuleService.getReportGenerationSettings(frameworkIds);

    return {
      reportGenerationSettings: entities.map(e => plainToInstance(ReportGenerationSettingDto, e))
    };
  }

  private async validateUpdateReportGenerationSettingsPayload(reportGenerationSettings: ReportGenerationSettingDto[]) {
    if (!reportGenerationSettings.length) {
      throw new HttpException('No settings provided', HttpStatus.BAD_REQUEST);
    }

    // Extract the first record's values for comparison
    const { frameworkId, financialYearId } = reportGenerationSettings[0];

    // Validate all records match
    const mismatch = reportGenerationSettings.some(
      dto =>
        dto.frameworkId !== frameworkId ||
        dto.financialYearId !== financialYearId
    );

    if (mismatch) {
      throw new HttpException('Malformed request', HttpStatus.BAD_REQUEST);
    }

    const existingRecords = await this.sectorQuestionDaoModuleService.getReportGenerationSettings(
      [frameworkId] // since all frameworkIds are same
    );

    const existingKeySet = new Set(
      existingRecords.map(
        r => `${r.financialYearId}-${r.frameworkId}-${r.settingName}`
      )
    );

    const missingRecords = reportGenerationSettings.filter(
      dto =>
        !existingKeySet.has(
          `${dto.financialYearId}-${dto.frameworkId}-${dto.settingName}`
        )
    );

    if (missingRecords.length) {
      throw new HttpException(
        `One or more settings do not exist in DB: ${missingRecords
          .map(m => m.settingName)
          .join(', ')}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  private async uploadFile(fileName: string, fileBody: string | Buffer): Promise<string> {
    let fileBuffer: Buffer;

    // ✅ Detect Buffer or String content
    if (Buffer.isBuffer(fileBody)) {
      fileBuffer = fileBody;
    } else {
      // Try decoding from Base64, fallback to UTF-8
      try {
        const base64Clean = fileBody.replace(/^data:.*;base64,/, ""); // Remove base64 prefix if present
        fileBuffer = Buffer.from(base64Clean, "base64");

        // Optional check: if decoded content is suspiciously small, assume it's not valid base64
        if (fileBuffer.length === 0) {
          throw new Error("Invalid base64 string");
        }
      } catch {
        // Fallback to utf8 (safe alternative to deprecated "binary")
        fileBuffer = Buffer.from(fileBody, "utf-8");
      }
    }

    // ✅ Detect MIME type from filename
    const contentType = mime.lookup(fileName) || "application/octet-stream";

    // ✅ Get Azure block blob client
    const blockBlobClient = this.containerClient.getBlockBlobClient(fileName);

    // ✅ Upload file to Azure Blob Storage
    await blockBlobClient.uploadData(fileBuffer, {
      blobHTTPHeaders: { blobContentType: contentType },
    });

    console.log("✅ File Uploaded Successfully to Azure:", blockBlobClient.url);

    return blockBlobClient.url;
  }

  async updateReportGenerationSettings(req: any, body: ReportGenerationSettingsDto): Promise<ReportGenerationSettingsDto> {
    const { reportGenerationSettings } = body;

    this.validateUpdateReportGenerationSettingsPayload(reportGenerationSettings);

    // Process any setting that has a fileBody (image or other binary)
    for (const setting of reportGenerationSettings) {
      const meta = setting.settingMetaAndAnswer || {};

      // If there's a fileBody but no URL, save it
      if (meta['fileBody'] && !meta['value']) {
        // Extract filename and extension
        const originalName = meta['fileName'];
        const extIndex = originalName.lastIndexOf('.');
        const baseName = extIndex !== -1 ? originalName.substring(0, extIndex) : originalName;
        const extension = extIndex !== -1 ? originalName.substring(extIndex) : '';

        // Get current DateTime in YYYYMMDD_HHMMSS format
        const now = new Date();
        const timestamp = now.toISOString()
          .replace(/[-:]/g, '')   // Remove - and :
          .replace('T', '_')      // Replace T with _
          .split('.')[0];         // Remove milliseconds

        // Build new filename
        const newFileName = `${baseName}_${timestamp}${extension}`;

        // Upload file with new filename
        const savedUrl = await this.uploadFile(newFileName, meta['fileBody']);

        // Save metadata and remove raw fileBody
        setting.settingMetaAndAnswer = {
          ...meta,
          fileName: newFileName, // Store updated fileName
          value: savedUrl
        };


        delete setting.settingMetaAndAnswer['fileBody'];
      }

    }

    const entities = await this.sectorQuestionDaoModuleService.updateReportGenerationSettings(reportGenerationSettings);

    return {
      reportGenerationSettings: entities.map(e => plainToInstance(ReportGenerationSettingDto, e))
    };
  }

  async getAssignedQuestionDetails(req: any) {
    const userId = req.query.userId;
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
    const getCompany = await this.userDaoService.getCompanyDetailsBasedOnUserId(userId);
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
      financial_year_id: 6,
      // financial_year_id: getESGReport[0]?.financialYearId,
      questionnaire_type: "QA",
      qIds: getAssignedDetails,
    };

    const getSectorQuestion = await this.externalApiCallService.getReq(
      process.env.COMPANY_SERVER_API_URL + 'getSectorQuestion',
      queryParam,
      {},
    );


    throw new HttpException(
      { status: 200, data: getSectorQuestion },
      HttpStatus.OK,
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

  private createTrendsHistoryEntity(existingRecord: any, questionnaireType: QuestionnaireType): SectorQuestionTrendsHistoryAnswerEntity {
    return new SectorQuestionTrendsHistoryAnswerEntity(
      existingRecord.userId, existingRecord.financialYearId, existingRecord.frameworkId, existingRecord.topicId, existingRecord.kpiId, existingRecord.questionId,
      existingRecord.dateRangeSourceId, existingRecord.sourceId, existingRecord.questionType as QuestionType, existingRecord.fromDate, existingRecord.toDate, existingRecord.answer, existingRecord.notApplicable, existingRecord.readingValue,
      null, null, null, existingRecord.companyId, questionnaireType, existingRecord.updatedAt,
      existingRecord.status as QuestionStatus,
    );
  }

  // private createAnswerEntity(systemUserId: any, item: any, financialYearId: number, sourceId: number, companyId: any, questionnaireType: QuestionnaireType, status: QuestionStatus): SectorQuestionAnswerEntity {
  //   return new SectorQuestionAnswerEntity(
  //     systemUserId, financialYearId, item.frameworkId, item.topicId, item.kpiId, item.questionId, String(item.answer), null, item.notApplicable, sourceId,
  //     JSON.stringify(item?.proofDocument), JSON.stringify(item?.proofDocumentNote), null, companyId, item.questionType as QuestionType, questionnaireType, status,
  //   );
  // }
  private createAnswerEntity(
    systemUserId: any,
    item: any,
    financialYearId: number,
    sourceId: number,
    companyId: any,
    questionnaireType: QuestionnaireType,
    status: QuestionStatus
  ): SectorQuestionAnswerEntity {
    return new SectorQuestionAnswerEntity(
      systemUserId,
      financialYearId,
      item.frameworkId,
      item.topicId ?? null,
      item.kpiId ?? null,
      item.questionId,
      String(item.answer ?? ''),
      null, // note (can update if needed)
      typeof item.notApplicable === 'string'
        ? item.notApplicable
        : item.notApplicable === true
          ? 'true'
          : item.notApplicable === false
            ? 'false'
            : null,
      sourceId,
      item.proofDocument ? JSON.stringify(item.proofDocument) : null,
      item.proofDocumentNote ? JSON.stringify(item.proofDocumentNote) : null,
      null, // remark (can update if needed)
      companyId,
      item.questionType as QuestionType,
      questionnaireType,
      status
    );
  }


  private createTabularAnswerEntity(systemUserId: any, item: any, financialYearId: number, companyId: any, questionnaireType: QuestionnaireType, status: QuestionStatus): SectorQuestionTabularAnswerEntity {
    return new SectorQuestionTabularAnswerEntity(
      systemUserId, financialYearId, item.frameworkId, item.topicId, item.kpiId, item.questionId, Number(item.source_id), "tabular_question" as QuestionType,
      JSON.stringify(item.answer), null, item.notApplicable, item?.performed, item?.proofDocument, item?.proofDocumentNote, null, companyId, questionnaireType, status,
    );
  }

  private createTrendsAnswerEntity(systemUserId: any, item: any, trends: any, financialYearId: number, companyId: any, questionnaireType: QuestionnaireType, status: QuestionStatus): SectorQuestionTrendsAnswerEntity {
    return new SectorQuestionTrendsAnswerEntity(
      systemUserId, financialYearId, item.frameworkId, item.topicId, item.kpiId, item.questionId,
      `${trends.from_date}-${trends.to_date}-${trends.meter_id}`, trends.meter_id, "quantitative_trends" as QuestionType, trends.from_date, trends.to_date,
      JSON.stringify(trends), item.notApplicable, trends.reading_value, null, item?.proofDocument, item?.proofDocumentNote, null, companyId, questionnaireType, status,
    );
  }

  private async getSectorQuestions(queryParam: any): Promise<any[]> {
    return await this.externalApiCallService.getReq(
      process.env.COMPANY_SERVER_API_URL + 'getSectorQuestionForGraph',
      queryParam,
      {},
    );
  }

  private async getFrameworkIds(companyId: number): Promise<number[]> {
    const response = await this.externalApiCallService.getReq(
      process.env.COMPANY_SERVER_API_URL + 'getFramework',
      { companyId: companyId, type: 'ALL', user_type_code: 'company' },
      {},
    );
    return response.data.map((obj: any) => obj.id);
  }

  /**
   * Returns the previous financial year string given one in "YYYY-YYYY" format.
   */
  private getPreviousFinancialYear(financialYear: string): string {
    const [start, end] = financialYear.split('-').map(y => parseInt(y, 10));
    if (isNaN(start) || isNaN(end)) {
      throw new Error(`Invalid financial year format: ${financialYear}`);
    }
    return `${start - 1}-${end - 1}`;
  }


  private async downloadImageAsDataUrl(imageUrl: string): Promise<string> {
    const source = axios.CancelToken.source();
    const timeout = setTimeout(() => {
      source.cancel(`Request timed out after 10 seconds`);
    }, 10_000);

    try {
      const res = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        headers: { Accept: 'image/*' },
        cancelToken: source.token,
      });

      // Size check (1 MB max)
      const contentLengthHeader = res.headers['content-length'];
      if (contentLengthHeader && parseInt(contentLengthHeader, 10) > 1 * 1024 * 1024) {
        throw new Error('Image too large (max 1MB).');
      }

      const contentType = res.headers['content-type'] || 'image/png';
      const base64 = Buffer.from(res.data).toString('base64');
      return `data:${contentType};base64,${base64}`;
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

}
