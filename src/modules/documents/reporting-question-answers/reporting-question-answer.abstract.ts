// abstract-reporting-answer.ts
import { ReportingQuestionAnswer } from "./reporting-question-answer.interface";
import { ReportingQuestionAnswerDTO } from "../dto/reporting-question-answer.dto";
import { HttpException, Injectable } from "@nestjs/common";
import { ReportingModuleDaoService } from "@app/modules/dao/reporting-module-dao/reporting-module-dao.service";
import { ReportingModuleService } from "@app/modules/reporting_module/reporting_module.service";
import { plainToInstance } from "class-transformer";
import { SaveAnswerReportingQuestionDto } from "@app/modules/reporting_module/dto/save-reporting_answer.dto";

@Injectable()
export abstract class AbstractReportingQuestionAnswer implements ReportingQuestionAnswer {
  constructor(
    protected readonly reportingModuleService: ReportingModuleService,
    protected readonly reportingModuleDaoService: ReportingModuleDaoService
  ) {}

  async save(req, dto: ReportingQuestionAnswerDTO, reportingQuestion): Promise<any> {
    if (!dto.addToReporting) {
      return;
    }
    const existing = await this.getReportingAnswer(dto);
    const payload = this.transformForSave(dto, reportingQuestion, existing);
    return await this.callSaveApi(req, payload);
  }

  async remove(req: any, dto: ReportingQuestionAnswerDTO, reportingQuestion: any): Promise<any> {
    const existing = await this.getReportingAnswer(dto);
    if (!existing) return;

    const payload = this.transformForRemove(dto, reportingQuestion, existing);
    return this.callSaveApi(req, payload);
  }

  abstract transformForSave(dto: ReportingQuestionAnswerDTO, reportingQuestion: any, existingAnswer: any): any;

  abstract transformForRemove(dto: ReportingQuestionAnswerDTO, reportingQuestion: any, existingAnswer: any): any;

  async getReportingAnswer(dto: ReportingQuestionAnswerDTO) {
    const answers = await this.reportingModuleDaoService.getReportingAnswer(dto.questionId, dto.financialYearId);
    return answers.find(ans => (
      ans.questionId === dto.questionId && 
      ans.sourceId === dto.sourceId && ans.subLocationId == dto.subLocationId &&
      (dto?.frequency !== 'CUSTOM' ||
          (ans.fromDate === dto.fromDate && ans.toDate === dto.toDate))
    ));
  }

  protected addAnswer(addReadings: boolean, newAnswer: string | number, existingAnswer: string, operationType: string) {
    if (!addReadings) {
      return existingAnswer ?? '';
    }

    if (existingAnswer) {
      if (operationType === 'SUM') {
        if (existingAnswer !== '' && isNaN(Number(existingAnswer))) {
          throw Error(`Existing Answer is not a number: ${existingAnswer}`);
        }

        if (isNaN(Number(newAnswer))) {
          throw Error(`Reading value is not a number: ${newAnswer}`);
        }

        return String(Number(Number(existingAnswer === '' ? 0 : existingAnswer) + Number(newAnswer)));
      } else if (operationType === 'REPLACE') {
        return String(newAnswer);
      } 

      throw Error(`Unsupported operation type ${operationType}`);
    } else {
      return String(newAnswer);
    }
  }


  protected removeAnswer(addReadings: boolean, newAnswer: string | number, existingAnswer: string, operationType: string) {
    if (!addReadings || !existingAnswer) {
      return existingAnswer ?? '';
    }

    if (!existingAnswer) {
      throw Error('No existing answer found for a remove operation');
    }

    if (operationType === 'SUM') {
      if (isNaN(Number(existingAnswer))) {
        throw Error(`Existing Answer is not a number: ${existingAnswer}`);
      }

      if (isNaN(Number(newAnswer))) {
        throw Error(`Reading value is not a number: ${newAnswer}`);
      }

      return String(Number(Number(existingAnswer === '' ? 0 : existingAnswer) - Number(newAnswer)));
    } else if (operationType === 'REPLACE') {
      // replace the existing vaue with empty string
      return '';
    } 

    throw Error(`Unsupported operation type ${operationType}`);

  }

  protected addProofDocument(dto: ReportingQuestionAnswerDTO, rowId: number, numRows: number, existingProofDocument: any) {
    if (rowId >= numRows) {
      throw Error(`Invalid rowId: ${rowId} for a proofDocument of size ${numRows}`);
    }

    if (existingProofDocument && existingProofDocument.length < rowId + 1) {
      throw Error(`Invalid rowId: ${rowId} for an existing proofDocument of size ${existingProofDocument.length}`);
    }

    const documentId = dto.documentId;
    const documentMeta = {
      addReadings: dto.addReadings
    }

    if (!existingProofDocument[rowId]) {
      existingProofDocument[rowId] = {};
    }

    existingProofDocument[rowId][documentId] = documentMeta;

    return existingProofDocument;
  }

  protected removeProofDocument(dto: ReportingQuestionAnswerDTO, rowId: number, numRows: number, existingProofDocument: any) {
    if (!existingProofDocument || existingProofDocument.length === 0) {
      // No documents exist at all → nothing to remove
      return [];
    }

    if (rowId >= numRows) {
      throw Error(`Invalid rowId: ${rowId} for a proofDocument of size ${numRows}`);
    }

    if (existingProofDocument && existingProofDocument.length < rowId + 1) {
      throw Error(
        `Invalid rowId: ${rowId} for an existing proofDocument of size ${existingProofDocument.length}`
      );
    }

    const documentId = dto.documentId;

    if (!existingProofDocument[rowId]) {
      // If row is somehow not initialized, treat it as empty
      existingProofDocument[rowId] = {};
      return existingProofDocument;
    }

    delete existingProofDocument[rowId][documentId];

    return existingProofDocument;
  }

  /**
   * Subclasses must implement how to call the API
   */
  private async callSaveApi(req, payload: any): Promise<any> {
    req.body = payload;
    const saveAnswerDto = plainToInstance(SaveAnswerReportingQuestionDto, payload);
    console.log(saveAnswerDto);
    try {
      await this.reportingModuleService.saveAnswerReportingQuestion(saveAnswerDto, req);
    } catch (error) {
      if (error instanceof HttpException) {
        if (error.getStatus() >= 200 && error.getStatus() < 300) {
          return error.getResponse();
        }
      }

      throw error;
    }
  }
}
