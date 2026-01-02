import { AbstractReportingQuestionAnswer } from "./reporting-question-answer.abstract";
import { ReportingQuestionAnswerDTO } from "../dto/reporting-question-answer.dto";
import { Injectable } from "@nestjs/common";
import { ReportingModuleDaoService } from "@app/modules/dao/reporting-module-dao/reporting-module-dao.service";
import { ReportingModuleService } from "@app/modules/reporting_module/reporting_module.service";


@Injectable()
export class YesNoReportingQuestionAnswer extends AbstractReportingQuestionAnswer {
  constructor(
    protected readonly reportingModuleService: ReportingModuleService,
    protected readonly reportingModuleDaoService: ReportingModuleDaoService
  ) {
    super(reportingModuleService, reportingModuleDaoService);
  }

  transformForSave(dto: ReportingQuestionAnswerDTO, reportingQuestion: any, existingAnswer: any): any {
    const proofDocument = this.removeProofDocument(
      dto, 0, 1, (Array.isArray(existingAnswer?.proofDocument) && existingAnswer.proofDocument.length > 0) ? existingAnswer.proofDocument : [{}]);

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
      answer: existingAnswer?.answer,
      proofDocument: proofDocument,
      note: existingAnswer?.note || [['']],
      questionType: reportingQuestion.questionType,
      frequency: reportingQuestion.frequency,
      status: existingAnswer?.status,
      response: existingAnswer?.answer,
      comment: existingAnswer?.proofDocumentNote || [[]]
    }
  }

  transformForRemove(dto: ReportingQuestionAnswerDTO, reportingQuestion: any, existingAnswer: any): any {
    const proofDocument = this.removeProofDocument(
      dto, 0, 1, (Array.isArray(existingAnswer?.proofDocument) && existingAnswer.proofDocument.length > 0) ? existingAnswer.proofDocument : [{}]);

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
      answer: existingAnswer?.answer,
      proofDocument: proofDocument,
      note: existingAnswer?.note || [['']],
      questionType: reportingQuestion.questionType,
      frequency: reportingQuestion.frequency,
      status: existingAnswer?.status,
      response: existingAnswer?.answer,
      comment: existingAnswer?.proofDocumentNote || [[]]
    }
  }
}
