import { ReportingArchiveEntity } from '@modules/reporting_archive_module/entities/reporting_archive_module.entity';
import { Injectable } from '@nestjs/common';
import { DataSource, In } from 'typeorm';

@Injectable()
export class ReportingArchiveModuleDaoService {
    constructor(private dataSource: DataSource) { }

    private getRepo(entity: any) {
        return this.dataSource.getRepository(entity);
    }
   
    async saveReportingArchiveQuestionAnswer(reportingArchiveEntity: ReportingArchiveEntity) {
        return this.getRepo(ReportingArchiveEntity).save(reportingArchiveEntity);
    }

    async getReportingArchiveQuestionAnswer(moduleIds: number[]) {
        return this.getRepo(ReportingArchiveEntity).find({ where: { moduleId: In(moduleIds) } });
    } 

    async getExistingRecordForOneTime(financialYearId: number, questionId: number, sourceId: number) {
        return this.getRepo(ReportingArchiveEntity).findOne({ where: { financialYearId, questionId, sourceId } });
    }

    async getExistingRecordForEveryFY(questionId: number, sourceId: number, financialYearId: number) {
        return this.getRepo(ReportingArchiveEntity).findOne({ where: { questionId, sourceId, financialYearId } });
    }

    async getExistingRecordForCustom(questionId: number, sourceId: number, financialYearId: number, fromDate: string, toDate: string) {
        return this.getRepo(ReportingArchiveEntity).findOne({ where: { questionId, sourceId, financialYearId, fromDate, toDate } });
    }

    async getExistingRecordForCustoms(questionId: number, sourceId: number, financialYearId: number, fromDate: string, toDate: string,subLocationId:number) {
        return this.getRepo(ReportingArchiveEntity).findOne({ where: { questionId, sourceId, financialYearId, fromDate, toDate,subLocationId } });
    }  

    async updateReportingQuestionAnswerForOneTime(questionId: number, reportingQuestionHistoryAnswerEntity: ReportingArchiveEntity) {
        return this.getRepo(ReportingArchiveEntity).update({ questionId }, reportingQuestionHistoryAnswerEntity);
    }

    async updateReportingQuestionAnswerForEveryFY(questionId: number, financialYearId: number, reportingQuestionHistoryAnswerEntity: ReportingArchiveEntity) {
        return this.getRepo(ReportingArchiveEntity).update({ questionId, financialYearId }, reportingQuestionHistoryAnswerEntity);
    }

    async updateReportingQuestionAnswerForCustom(questionId: number, financialYearId: number, fromDate: string, toDate: string, reportingQuestionHistoryAnswerEntity: ReportingArchiveEntity) {
        return this.getRepo(ReportingArchiveEntity).update({ questionId, financialYearId, fromDate, toDate }, reportingQuestionHistoryAnswerEntity);
    }

    async getReportingAnswer(questionId: number, financialYearId: Number) {
        return this.getRepo(ReportingArchiveEntity).find({ where: { questionId, financialYearId } });
    }
} 
