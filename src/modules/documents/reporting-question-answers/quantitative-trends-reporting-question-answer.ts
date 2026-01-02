import { AbstractReportingQuestionAnswer } from "./reporting-question-answer.abstract";
import { ReportingQuestionAnswerDTO } from "../dto/reporting-question-answer.dto";
import { Injectable } from "@nestjs/common";
import { ReportingModuleDaoService } from "@app/modules/dao/reporting-module-dao/reporting-module-dao.service";
import { ReportingModuleService } from "@app/modules/reporting_module/reporting_module.service";


@Injectable()
export class QuantitativeTrendsReportingQuestionAnswer extends AbstractReportingQuestionAnswer {
  constructor(
    protected readonly reportingModuleService: ReportingModuleService,
    protected readonly reportingModuleDaoService: ReportingModuleDaoService
  ) {
    super(reportingModuleService, reportingModuleDaoService);
  }

  transformForSave(dto: ReportingQuestionAnswerDTO, reportingQuestion: any, existingAnswer: any): any {
    let existingReadingValue = '0';
    try {
      existingReadingValue = JSON.parse(existingAnswer.answer)?.readingValue;
    } catch (error) {
      console.error(`Error parsing answer: ${existingAnswer.answer}`);
    }

    const proofDocument = this.removeProofDocument(
      dto, 0, 1, (Array.isArray(existingAnswer?.proofDocument) && existingAnswer.proofDocument.length > 0) ? existingAnswer.proofDocument : [{}]);
    const readingValue = this.removeAnswer(dto.addReadings, dto.readingValue, existingReadingValue, dto.operationType);

    const answer = {
      questionId: dto.questionId,
      moduleId: reportingQuestion.moduleId,
      questionType: reportingQuestion.questionType,
      questionTitle: reportingQuestion.title,
      fromDate: dto.fromDate,
      toDate: dto.toDate,
      frequency: reportingQuestion.frequency,
      readingValue: readingValue,
      unit: dto.readingColumn
    };

    return {
      current_role: 'company',
      financialYearId: dto.financialYearId,
      moduleId: reportingQuestion.moduleId,
      questionId: dto.questionId,
      questionTitle: reportingQuestion.title,
      readingValue: '',
      sourceId: dto.sourceId,
      fromDate:dto.fromDate,
      toDate: dto.toDate,
      notApplicable: false,
      answer: JSON.stringify(answer),
      proofDocument: proofDocument,
      note: existingAnswer?.note || [['']],
      questionType: reportingQuestion.questionType,
      frequency: reportingQuestion.frequency,
      status: existingAnswer?.status,
      response: JSON.stringify(answer),
      comment: existingAnswer?.proofDocumentNote || [[]]
    }
  }

  transformForRemove(dto: ReportingQuestionAnswerDTO, reportingQuestion: any, existingAnswer: any): any {
    let existingReadingValue;
    try {
      existingReadingValue = JSON.parse(existingAnswer.answer)?.readingValue;
    } catch (error) {
      console.error(`Error parsing answer: ${existingAnswer.answer}`);
    }

    const proofDocument = this.removeProofDocument(
      dto, 0, 1, (Array.isArray(existingAnswer?.proofDocument) && existingAnswer.proofDocument.length > 0) ? existingAnswer.proofDocument : [{}]);
    const readingValue = this.removeAnswer(dto.addReadings, dto.readingValue, existingReadingValue, dto.operationType);

    const answer = {
      questionId: dto.questionId,
      moduleId: reportingQuestion.moduleId,
      questionType: reportingQuestion.questionType,
      questionTitle: reportingQuestion.title,
      fromDate: dto.fromDate,
      toDate: dto.toDate,
      frequency: reportingQuestion.frequency,
      readingValue: readingValue,
      unit: dto.readingColumn
    };

    return {
      current_role: 'company',
      financialYearId: dto.financialYearId,
      moduleId: reportingQuestion.moduleId,
      questionId: dto.questionId,
      questionTitle: reportingQuestion.title,
      readingValue: '',
      sourceId: dto.sourceId,
      fromDate:dto.fromDate,
      toDate: dto.toDate,
      notApplicable: false,
      answer: JSON.stringify(answer),
      proofDocument: proofDocument,
      note: existingAnswer?.note || [['']],
      questionType: reportingQuestion.questionType,
      frequency: reportingQuestion.frequency,
      status: existingAnswer?.status,
      response: JSON.stringify(answer),
      comment: existingAnswer?.proofDocumentNote || [[]]
    }
  }
}
