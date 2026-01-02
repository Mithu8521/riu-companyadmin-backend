import { ReportingChatEntity } from '@app/modules/reporting_module/entities/chat.entity';
import { AssignQuestionEntity } from '@app/modules/sector_question/entities/assign_question.entity';
import { SubUserEntity } from '@app/modules/setting/sub-user/entities/sub-user.entity';
import { QuestionnaireType } from '@app/utils/enums/Status';
import { ReportingQuestionAnswerEntity } from '@modules/reporting_module/entities/reporting_question_answer.entity';
import { ReportingQuestionHistoryAnswerEntity } from '@modules/reporting_module/entities/reporting_question_answer_history.entity';
import { ReportingDueDateOverrideEntity } from '@modules/reporting_module/entities/reporting_question_approval.entity';
import { Injectable } from '@nestjs/common';
import { DataSource, In, MoreThan, MoreThanOrEqual, Repository } from 'typeorm';

@Injectable()
export class ReportingModuleDaoService {
    constructor(private dataSource: DataSource) { }

    private getRepo(entity: any) {
        return this.dataSource.getRepository(entity);
    }

    private getNewRepo<T>(entity: { new(): T }) {
        return this.dataSource.getRepository<T>(entity);
    }

    async getExistingRecordForOneTime(financialYearId: number, questionId: number, sourceId: number) {
        return this.getRepo(ReportingQuestionAnswerEntity).findOne({ where: { financialYearId, questionId, sourceId } });
    }

    async getExistingRecordForEveryFY(questionId: number, sourceId: number, financialYearId: number) {
        return this.getRepo(ReportingQuestionAnswerEntity).findOne({ where: { questionId, sourceId, financialYearId } });
    }

    async getRecordsBasedOnFilters(filter: any) {

        return await this.getRepo(ReportingQuestionAnswerEntity).findOne(filter)
    }

    async getUserQuestionMapping(filterData: {
        financialYearId: number;
        questionId: number;
    }) {
        const { financialYearId, questionId } = filterData;
        const filter = {
            where: { financialYearId, questionId },
            select: ['assignedTo'],
        };

       return await this.getRepo(AssignQuestionEntity).findOne({
            where: filter.where,
            select: filter.select,
        });

    }


    async getDataOwner(assignedUserIdsList: any) {
        let filter = {
            where: {
                companyId: In(assignedUserIdsList),
                status: 1,
            },
        }
        return await this.getRepo(SubUserEntity).find(filter)
    }

    async getDueDateOverrideByUniqueKeys(
        financialYearId: number,
        questionId: number,
        sourceId: number,
        fromDate: string,
        toDate: string,
    ): Promise<ReportingDueDateOverrideEntity | null> {
        return this.getNewRepo(ReportingDueDateOverrideEntity).findOne({
            where: { financialYearId, questionId, sourceId, fromDate, toDate },
        });
    }

    async getDueDateOverrideById(
        id: number,
    ): Promise<ReportingDueDateOverrideEntity | null> {
        return this.getNewRepo(ReportingDueDateOverrideEntity).findOne({
            where: { id },
        });
    }


    // DAO method
    async getDueDateOverridesByFinancialYear(financialYearId: number): Promise<ReportingDueDateOverrideEntity[]> {
        return this.getNewRepo(ReportingDueDateOverrideEntity).find({
            where: { financialYearId },
            relations: ['user', 'source', 'approver'], // Include related entities
            order: { createdAt: 'DESC' },
        });
    }

    async saveDueDateOverride(entity: ReportingDueDateOverrideEntity): Promise<ReportingDueDateOverrideEntity> {
        return this.getNewRepo(ReportingDueDateOverrideEntity).save(entity);
    }

    async getExistingRecordForCustom(questionId: number, sourceId: number, financialYearId: number, fromDate: string, toDate: string) {
        return this.getRepo(ReportingQuestionAnswerEntity).findOne({ where: { questionId, sourceId, financialYearId, fromDate, toDate } });
    }

    async getExistingRecordForCustoms(questionId: number, sourceId: number, financialYearId: number, fromDate: string, toDate: string, subLocationId: number) {
        return this.getRepo(ReportingQuestionAnswerEntity).findOne({ where: { questionId, sourceId, financialYearId, fromDate, toDate, subLocationId } });
    }

    async saveReportingQuestionHistoryAnswer(reportingQuestionAnswerEntity: ReportingQuestionHistoryAnswerEntity) {
        return this.getRepo(ReportingQuestionHistoryAnswerEntity).save(reportingQuestionAnswerEntity);
    }



    async getChatFromFilter(filter: any) {
        const where: any = {};
        if (filter.createdAt) {
            where.createdAt = MoreThanOrEqual(new Date(filter.createdAt));
        }
        if (filter.questionId != null) {
            const qId = Number(filter.questionId);
            if (Number.isFinite(qId)) where.questionId = qId;
        }

        if (filter.financialYearId != null) {
            const fyId = Number(filter.financialYearId);
            if (Number.isFinite(fyId)) where.financialYearId = fyId;
        }

        if (filter.sourceId != null) {
            const srcId = Number(filter.sourceId);
            if (Number.isFinite(srcId)) where.sourceId = srcId;
        }

        if (filter.subLocationId != null) {
            const subLocId = Number(filter.subLocationId);
            if (Number.isFinite(subLocId)) where.subLocationId = subLocId;
        }

        if (filter.fromDate) {
            where.fromDate = filter.fromDate;
        }

        if (filter.toDate) {
            where.toDate = filter.toDate;
        }

        const repo = this.getRepo(ReportingChatEntity);

        return repo.createQueryBuilder('chat')
            .leftJoin('chat.senderUser', 'user')
            .addSelect([
                'user.id',
                'user.first_name',
                'user.last_name',
                'user.email',
            ])
            .where(where)
            .orderBy('chat.createdAt', 'ASC')
            .getMany();
    }


    async firstChatForAuditorUser(filter: any) {
        const repo = this.getRepo(ReportingChatEntity);
        const firstChat = await repo.findOne({ where: filter.where, order: { createdAt: 'ASC' } })
        return firstChat;
    }
    

    async getChatByUserIds(params: {
        baseFilter: {
            questionId: number;
            financialYearId: number;
            sourceId?: number | null;
            subLocationId?: number | null;
            fromDate?: string | null;
            toDate?: string | null;
        };
        senderIds: number[];
    }) {
        const repo = this.getRepo(ReportingChatEntity);
        const { baseFilter, senderIds } = params;

        if (!senderIds.length) return [];

        const where: any = {
            questionId: baseFilter.questionId,
            financialYearId: baseFilter.financialYearId,
            senderId: In(senderIds),
        };

        if (baseFilter.sourceId) where.sourceId = baseFilter.sourceId;
        if (baseFilter.subLocationId) where.subLocationId = baseFilter.subLocationId;

        if (baseFilter.fromDate) where.fromDate = baseFilter.fromDate;
        if (baseFilter.toDate) where.toDate = baseFilter.toDate;

        return repo.find({
            where,
            select: ["senderId"],
        });
    }


    async appendMessege(msgObject: any): Promise<any> {
        const repo = this.getRepo(ReportingChatEntity);
        const newChat = repo.create(msgObject);
        return await repo.save(newChat);
    }
    async updateReportingQuestionAnswerForOneTime(questionId: number, financialYearId: number, reportingQuestionHistoryAnswerEntity: ReportingQuestionAnswerEntity) {
        return this.getRepo(ReportingQuestionAnswerEntity).update({ questionId, financialYearId }, reportingQuestionHistoryAnswerEntity);
    }

    async updateReportingQuestionAnswerForEveryFY(questionId: number, financialYearId: number, reportingQuestionHistoryAnswerEntity: ReportingQuestionAnswerEntity) {
        return this.getRepo(ReportingQuestionAnswerEntity).update({ questionId, financialYearId }, reportingQuestionHistoryAnswerEntity);
    }

    async updateReportingQuestionAnswerForCustom(questionId: number, financialYearId: number, sourceId: number, fromDate: string, toDate: string, reportingQuestionHistoryAnswerEntity: ReportingQuestionAnswerEntity) {
        return this.getRepo(ReportingQuestionAnswerEntity).update({ questionId, financialYearId, sourceId, fromDate, toDate }, reportingQuestionHistoryAnswerEntity);
    }
    async updateReportingQuestionAnswerForSubForCustom(questionId: number, financialYearId: number, sourceId: number, subLocationId: number, fromDate: string, toDate: string, reportingQuestionHistoryAnswerEntity: ReportingQuestionAnswerEntity) {
        return this.getRepo(ReportingQuestionAnswerEntity).update({ questionId, financialYearId, sourceId, subLocationId, fromDate, toDate }, reportingQuestionHistoryAnswerEntity);
    }

    async updateReportingBasedOnId(id: number, answer: any) {
        return this.getRepo(ReportingQuestionAnswerEntity).update({ id }, { answer });
    }

    async updateReportingStatusForCustom(id: number, status: string) {
        return this.getRepo(ReportingQuestionAnswerEntity).update({ id }, { status });
    }

    async saveReportingQuestionAnswer(reportingQuestionAnswerEntity: ReportingQuestionAnswerEntity) {
        return this.getRepo(ReportingQuestionAnswerEntity).save(reportingQuestionAnswerEntity);
    }

    async getReportingQuestionAnswer(moduleIds: number[], financialYearId: Number) {
        return this.getRepo(ReportingQuestionAnswerEntity).find({ where: { moduleId: In(moduleIds), financialYearId } });
    }


    async getReportingQuestionAnswerBasedFinancialYear(financialYearId: Number) {
        return this.getRepo(ReportingQuestionAnswerEntity).find({ where: { financialYearId } });
    }

    async getReportingQuestionAnswers(questionId: number[], financialYearId: Number) {
        return this.getRepo(ReportingQuestionAnswerEntity).find({ where: { questionId: In(questionId), financialYearId }, });
    }

    async getReportingAnswer(questionId: number, financialYearId: Number) {
        return this.getRepo(ReportingQuestionAnswerEntity).find({ where: { questionId, financialYearId } });
    }

    async getReportingHistoryAnswer(questionId: number, financialYearId: Number) {
        return this.getRepo(ReportingQuestionHistoryAnswerEntity).find({ where: { questionId, financialYearId } });
    }

    async getReportingQuestionAnswersBasedOnFilter(fromDate: string[], locationIds: number[], financialYearId: number) {
        return this.getRepo(ReportingQuestionAnswerEntity).find({ where: { sourceId: In(locationIds), fromDate: In(fromDate), financialYearId } });
    }

    async getReportingQuestionAnswerBasedOnLOcation(locationIds: number[], financialYearId: number) {
        return this.getRepo(ReportingQuestionAnswerEntity).find({ where: { sourceId: In(locationIds), financialYearId } });
    }


    async getReportingQuestionAnswerBasedFnancialIds(financialYearId: Number) {
        return this.getRepo(ReportingQuestionAnswerEntity).find({ where: { financialYearId: financialYearId } });
    }

    async getReportingQuestionAnswerBasedId(financialYearId: number, questionId: number[]) {
        return this.getRepo(ReportingQuestionAnswerEntity).find({ where: { financialYearId, questionId: In(questionId) } });
    }

    async getReportingQuestionAnswerBasedOnFilter(filters: {
        financialYearId: number;
        questionId: number;
        sourceId: number;
        subLocationId: number;
        fromDate: string;
        toDate: string;
    }): Promise<ReportingQuestionAnswerEntity | null> {
        const {
            financialYearId,
            questionId,
            sourceId,
            subLocationId,
            fromDate,
            toDate,
        } = filters;

        if (
            !financialYearId ||
            !questionId ||
            !sourceId ||
            !subLocationId ||
            !fromDate ||
            !toDate
        ) {
            throw new Error("All filter fields are required");
        }

        return await (this.getRepo(ReportingQuestionAnswerEntity) as Repository<ReportingQuestionAnswerEntity>).findOne({
            where: {
                financialYearId,
                questionId,
                sourceId,
                subLocationId,
                fromDate,
                toDate,
            },
        });
    }

} 
