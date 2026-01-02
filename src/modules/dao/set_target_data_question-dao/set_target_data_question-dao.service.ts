
import { ReportingQuestionAnswerEntity } from '@modules/reporting_module/entities/reporting_question_answer.entity';
import { ReportingQuestionHistoryAnswerEntity } from '@modules/reporting_module/entities/reporting_question_answer_history.entity';
import { ReportingQuestionTargetDataEntity } from '@modules/set_target_data_question/entities/set_target_data_question.entity';
import { Injectable } from '@nestjs/common';
import { DataSource, In } from 'typeorm';

@Injectable()
export class SetTargetDataQuestionDaoService {
    constructor(private dataSource: DataSource) { }

    private getRepo(entity: any) {
        return this.dataSource.getRepository(entity);
    }

    async ReportingQuestionTargetDataEntity(financialYearId: number, questionId: number, sourceId: number, fromDate: string, toDate: string) {
        return this.getRepo(ReportingQuestionTargetDataEntity).findOne({ where: { financialYearId, questionId, sourceId, fromDate, toDate } });
    }

    async ReportingQuestionTabularTargetDataEntity(financialYearId: number, questionId: number, sourceId: number, fromDate: string, toDate: string,columnId:number,rowId:number) {
        return this.getRepo(ReportingQuestionTargetDataEntity).findOne({ where: { financialYearId, questionId, sourceId, fromDate, toDate,columnId,rowId } });
    }    

    async updateReportingQuestionAnswerTargetFor(financialYearId: number,questionId: number, fromDate:string, toDate:string,sourceId:number, columnId:number, rowId:number, reportingQuestionTargetDataEntity: ReportingQuestionTargetDataEntity) {
        return this.getRepo(ReportingQuestionTargetDataEntity).update({financialYearId,fromDate, toDate,sourceId, questionId, columnId, rowId }, reportingQuestionTargetDataEntity);
    }

    async saveReportingQuestionTargetAnswer(reportingQuestionTargetDataEntity: ReportingQuestionTargetDataEntity) {
        return this.getRepo(ReportingQuestionTargetDataEntity).save(reportingQuestionTargetDataEntity);
    }

    async getTargetQuestionAnswer( financialYearId: Number) {
        return this.getRepo(ReportingQuestionTargetDataEntity).find({ where: {financialYearId } });
    }

    async getTargetQuestionAnswerBasedOnQuestion(qIds: number[], financialYearId: number) {
        return await this.getRepo(ReportingQuestionTargetDataEntity).find({
            where: { questionId: In(qIds), financialYearId },
            select: ['id', 'questionId', 'sourceId', 'subLocationId', 'fromDate', 'toDate', 'minTargetData', 'maxTargetData', 'rowId', 'columnId', 'financialYearId']
        });
      }

    async getTargetQuestionsAnswer( financialYearId: Number, sourceId:Number,questionId:number,fromDate:number) {
        return this.getRepo(ReportingQuestionTargetDataEntity).find({ where: {financialYearId,sourceId ,questionId,fromDate} });
    }

    async getTargetQuestionsAnswers( financialYearId: Number, questionId:Number) {
        return this.getRepo(ReportingQuestionTargetDataEntity).findOne({ where: {financialYearId,questionId } });
    }

    async getAllTargetQuestionsAnswers( financialYearId: Number, questionId:Number) {
        return this.getRepo(ReportingQuestionTargetDataEntity).find({ where: {financialYearId,questionId } });
    }

    async getExistingTergetValue(questionId: number, sourceId: number, fromDate: string, toDate: string) {
        return this.getRepo(ReportingQuestionTargetDataEntity).findOne({ where: { questionId, sourceId, fromDate, toDate } });
    }

    async getExistingRecordForEveryFY(questionId: number, sourceId: number, financialYearId: number) {
        return this.getRepo(ReportingQuestionAnswerEntity).findOne({ where: { questionId, sourceId, financialYearId } });
    }

    async getExistingRecordForCustom(questionId: number, sourceId: number, financialYearId: number, fromDate: string, toDate: string) {
        return this.getRepo(ReportingQuestionAnswerEntity).findOne({ where: { questionId, sourceId, financialYearId, fromDate, toDate } });
    }

    async saveReportingQuestionHistoryAnswer(reportingQuestionAnswerEntity: ReportingQuestionHistoryAnswerEntity) {
        return this.getRepo(ReportingQuestionHistoryAnswerEntity).save(reportingQuestionAnswerEntity);
    }

    async updateReportingQuestionAnswerForOneTime(questionId: number, reportingQuestionHistoryAnswerEntity: ReportingQuestionAnswerEntity) {
        return this.getRepo(ReportingQuestionAnswerEntity).update({ questionId }, reportingQuestionHistoryAnswerEntity);
    }

    async updateReportingQuestionAnswerForEveryFY(questionId: number, financialYearId: number, reportingQuestionHistoryAnswerEntity: ReportingQuestionAnswerEntity) {
        return this.getRepo(ReportingQuestionAnswerEntity).update({ questionId, financialYearId }, reportingQuestionHistoryAnswerEntity);
    }

    async updateReportingQuestionAnswerForCustom(questionId: number, financialYearId: number, fromDate: string, toDate: string, reportingQuestionHistoryAnswerEntity: ReportingQuestionAnswerEntity) {
        return this.getRepo(ReportingQuestionAnswerEntity).update({ questionId, financialYearId, fromDate, toDate }, reportingQuestionHistoryAnswerEntity);
    }

    async saveReportingQuestionAnswer(reportingQuestionAnswerEntity: ReportingQuestionAnswerEntity) {
        return this.getRepo(ReportingQuestionAnswerEntity).save(reportingQuestionAnswerEntity);
    }

    async getReportingQuestionAnswer(moduleIds: number[]) {
        return this.getRepo(ReportingQuestionAnswerEntity).find({ where: { moduleId: In(moduleIds) } });
    }

    async getReportingQuestionAnswerBasedFnancialIds(financialYearId: Number) {
        return this.getRepo(ReportingQuestionAnswerEntity).find({ where: { financialYearId: financialYearId } });
    }

    async getReportingQuestionAnswerBasedId(questionId: number[]) {
        return this.getRepo(ReportingQuestionAnswerEntity).find({ where: { questionId: In(questionId) } });
    }

} 
