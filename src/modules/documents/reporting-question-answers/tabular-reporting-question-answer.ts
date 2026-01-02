import { AbstractReportingQuestionAnswer } from "./reporting-question-answer.abstract";
import { ReportingQuestionAnswerDTO } from "../dto/reporting-question-answer.dto";
import { Injectable } from "@nestjs/common";
import { ReportingModuleDaoService } from "@app/modules/dao/reporting-module-dao/reporting-module-dao.service";
import { ReportingModuleService } from "@app/modules/reporting_module/reporting_module.service";



@Injectable()
export class TabularReportingQuestionAnswer extends AbstractReportingQuestionAnswer {
  constructor(
    protected readonly reportingModuleService: ReportingModuleService,
    protected readonly reportingModuleDaoService: ReportingModuleDaoService
  ) {
    super(reportingModuleService, reportingModuleDaoService);
  }

  transformForSave(dto: ReportingQuestionAnswerDTO, reportingQuestion: any, existingAnswer: any): any {

    let {answer, proofDocument} = this.getExistingAnswerAndProofDocument(existingAnswer, reportingQuestion);

    if (dto.row == null || (dto.addReadings && dto.readingColumn == null)) {
      throw Error('attribute row and readingColumn is required for Tabular Question Type');
    }

    if (dto.row >= answer.length || (dto.addReadings && dto.readingColumn >= answer[dto.row].length)) {
      throw Error(`Invalid row: ${dto.row} and column: ${dto.readingColumn} for Tabular Question Type: ${JSON.stringify(dto)}`);
    }

    if (dto.addReadings) {
      answer[dto.row][dto.readingColumn] = this.addAnswer(dto.addReadings, dto.readingValue, answer[dto.row][dto.readingColumn], dto.operationType);
    }
    proofDocument = this.addProofDocument(dto, dto.row, answer.length, proofDocument);

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

    let {answer, proofDocument} = this.getExistingAnswerAndProofDocument(existingAnswer, reportingQuestion);

    if (dto.row == null || (dto.addReadings && dto.readingColumn == null)) {
      throw Error('attribute row and readingColumn is required for Tabular Question Type');
    }

    if (dto.row >= answer.length || (dto.addReadings && dto.readingColumn >= answer[dto.row].length)) {
      throw Error(`Invalid row: ${dto.row} and column: ${dto.readingColumn} for Tabular Question Type: ${JSON.stringify(dto)}`);
    }

    if (dto.addReadings) {
      answer[dto.row][dto.readingColumn] = this.removeAnswer(dto.addReadings, dto.readingValue, answer[dto.row][dto.readingColumn], dto.operationType);
    }
    proofDocument = this.removeProofDocument(dto, dto.row, answer.length, proofDocument);

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

  private getExistingAnswerAndProofDocument(existingAnswer, reportingQuestion): {answer, proofDocument} {
    const rows = reportingQuestion.details.filter(detail => detail.option_type === 'row').map(detail => detail.option);
    
    let answer;
    let proofDocument;

    if (existingAnswer) {
      try {
        answer = JSON.parse(existingAnswer.answer);
        proofDocument = existingAnswer.proofDocument || [];
        if (answer.length > proofDocument.length) {
          for (let i=proofDocument.length ; i< answer.length; i++) {
            proofDocument.push({});
          }
        }
      } catch (error) {
        console.error(`Error parsing existing answer: ${existingAnswer}`, error);
        throw Error('Error parsing existing answer');
      }
    } else {
      if (rows.length === 1 && rows[0] === '1') {
        console.error(`No rows found: ${reportingQuestion}`);
        throw Error('No rows found');
      }

      const columnCountsMap = {};
      reportingQuestion.details.forEach(detail => {
        if (detail.option_type.startsWith('column')) {
          const rowNumber = Number(detail.option_type.replace('column', ''));
          columnCountsMap[rowNumber] = (columnCountsMap[rowNumber] || 0) + 1;
        }
      });

      // Find maximum columns from columnCounts
      let maxColumns = Math.max(...(Object.values(columnCountsMap) as []));

      answer = [];
      proofDocument = [];
      for (let i=0; i<rows.length; i++) {
        answer.push(new Array(maxColumns).fill(""));
        proofDocument.push({});
      }
    }

    return {answer, proofDocument};
  }
}
