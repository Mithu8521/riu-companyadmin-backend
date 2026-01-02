import { UserDaoService } from '@modules/dao/setting/user-dao/user-dao.service';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { SaveReportingArchiveModuleDto } from './dto/create-reporting_archive_module.dto';
import { QuestionType, QuestionnaireType } from '@utils/enums/Status';
import { ReportingArchiveEntity } from './entities/reporting_archive_module.entity';
import { ReportingArchiveModuleDaoService } from '@modules/dao/reporting-archive-module-dao/reporting-archive-module-dao.service';

@Injectable()
export class ReportingArchiveModuleService {
  constructor(private userDaoService: UserDaoService, private reportingArchiveModuleDaoService: ReportingArchiveModuleDaoService
  ) { }

  async saveArchiveAnswerReporting(saveAnswerReportingQuestionDto: SaveReportingArchiveModuleDto, req: any) {
    const systemUserId = req.headers.userid;
    const financialYearId = req.body.financialYearId;
    const subLocationId = req.body.subLocationId;
    const { questionId, questionType, answer, sourceId, fromDate, toDate, notApplicable, proofDocument, proofDocumentNote, note, frequency, moduleId } = saveAnswerReportingQuestionDto;
    const companyId = (await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId)).company_id;
    const questionnaireType: QuestionnaireType = 'CA' as QuestionnaireType;

    let existingRecord;
    let answerEntity;

    if (frequency === "ONE_TIME") {
      existingRecord = await this.reportingArchiveModuleDaoService.getExistingRecordForOneTime(financialYearId, questionId, sourceId);

      answerEntity = this.createReportingAnswerEntity(systemUserId, financialYearId, questionId, sourceId, moduleId, fromDate, toDate, notApplicable, answer, proofDocument, proofDocumentNote, note, questionType as QuestionType, companyId, questionnaireType);

      if (existingRecord) {
        await this.reportingArchiveModuleDaoService.updateReportingQuestionAnswerForOneTime(questionId, answerEntity);
      } else {
        await this.reportingArchiveModuleDaoService.saveReportingArchiveQuestionAnswer(answerEntity);
      }
    }
    else if (frequency === "EVERY_FY") {
      existingRecord = await this.reportingArchiveModuleDaoService.getExistingRecordForEveryFY(questionId, sourceId, financialYearId);

      answerEntity = this.createReportingAnswerEntity(systemUserId, financialYearId, questionId, sourceId, moduleId, fromDate, toDate, notApplicable, answer, proofDocument, proofDocumentNote, note, questionType as QuestionType, companyId, questionnaireType);

      if (existingRecord) {
        await this.reportingArchiveModuleDaoService.updateReportingQuestionAnswerForEveryFY(questionId, financialYearId, answerEntity);
      } else {
        await this.reportingArchiveModuleDaoService.saveReportingArchiveQuestionAnswer(answerEntity);
      }
    }
    else if (frequency === "CUSTOM") {
      existingRecord = subLocationId
        ? await this.reportingArchiveModuleDaoService.getExistingRecordForCustoms(questionId, sourceId, financialYearId, fromDate, toDate, subLocationId)
        : await this.reportingArchiveModuleDaoService.getExistingRecordForCustom(questionId, sourceId, financialYearId, fromDate, toDate);

      answerEntity = this.createReportingAnswerEntity(systemUserId, financialYearId, questionId, sourceId, moduleId, fromDate, toDate, notApplicable, answer, proofDocument, proofDocumentNote, note, questionType as QuestionType, companyId, questionnaireType);

      if (existingRecord) {
        await this.reportingArchiveModuleDaoService.updateReportingQuestionAnswerForCustom(questionId, financialYearId, fromDate, toDate, answerEntity);
      } else {
        await this.reportingArchiveModuleDaoService.saveReportingArchiveQuestionAnswer(answerEntity);
      }
    }

    throw new HttpException({ status: 200, message: 'Answer Saved', answers: answer }, HttpStatus.OK);
  }



  async getReportingArchiveAnswer(req: any) {
    const { financialYearId, questionId } = req.query;
    if (!questionId) {
      throw new HttpException({ status: 400, message: 'Question not found', answers: [] }, HttpStatus.CONFLICT);
    }
    const reportingAnswer = await this.reportingArchiveModuleDaoService.getReportingAnswer(questionId, Number(financialYearId));
    throw new HttpException({ status: 200, message: 'Data Found', answers: reportingAnswer }, HttpStatus.OK);
  }

  private createReportingAnswerEntity(systemUserId: any, financialYearId: number, questionId: number, sourceId: number, moduleId: number, fromDate: string, toDate: string,
    notApplicable: boolean, answer: string, proofDocument: string[][], proofDocumentNote: string[][], note: string[][], questionType: QuestionType, companyId: any, questionnaireType: QuestionnaireType): ReportingArchiveEntity {
    return new ReportingArchiveEntity(
      systemUserId, financialYearId, questionId, sourceId, moduleId, fromDate, toDate, notApplicable, answer, proofDocument, proofDocumentNote, note, questionType as QuestionType, companyId, questionnaireType
    );
  }
}
