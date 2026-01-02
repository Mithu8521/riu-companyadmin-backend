import { AuditListingEntity } from '@modules/audit/entities/audit_listing.entity';
import { GraphFilterEntity } from '@modules/dashboard/entities/graph_filter.entity';
import { TodaysActivity } from '@modules/dashboard/entities/today_activity.entity';
import { ReportingQuestionAnswerEntity } from '@modules/reporting_module/entities/reporting_question_answer.entity';
import { AssignQuestionEntity } from '@modules/sector_question/entities/assign_question.entity';
import { SectorQuestionAnswerEntity } from '@modules/sector_question/entities/sector_question_answers.entity';
import { SectorQuestionTrendsAnswerEntity } from '@modules/sector_question/entities/sector_question_trends_answer.entity';
import { SectorQuestionTabularAnswerEntity } from '@modules/sector_question/entities/sector_tabular_question_answer.entity';
import { Injectable } from '@nestjs/common';
import { QuestionStatus } from '@utils/enums/Status';
import { Between, DataSource, In, Like } from 'typeorm';

@Injectable()
export class DashboardDaoService {
    constructor(private dataSource: DataSource) { }

    private getRepo(entity: any) {
        return this.dataSource.getRepository(entity);
    }
    async doneQuestionByUserId(userId: number, auditStatus: QuestionStatus, financialYearId: number) {
        const currentDate = new Date();
        const last7Days = new Date(currentDate);
        last7Days.setDate(currentDate.getDate() - 7);
        const updatedAnswers = await Promise.all([
            this.dataSource.getRepository(SectorQuestionAnswerEntity).find({
                where: {
                    userId,
                    updatedAt: Between(last7Days, currentDate),
                    status: "ACCEPTED" as QuestionStatus,
                    financialYearId
                },
            }),
            this.dataSource.getRepository(SectorQuestionTrendsAnswerEntity).find({
                where: {
                    userId,
                    updatedAt: Between(last7Days, currentDate),
                    status: "ACCEPTED" as QuestionStatus,
                    financialYearId
                },
            }),
            this.dataSource.getRepository(SectorQuestionTabularAnswerEntity).find({
                where: {
                    userId,
                    updatedAt: Between(last7Days, currentDate),
                    status: "ACCEPTED" as QuestionStatus,
                    financialYearId
                },
            }),
        ]);
        // let doneQuestion = this.dataSource.getRepository(AuditHistoryEntity).find({ where: { auditerId, auditStatus } });
        const flattenedData = updatedAnswers.flat();
        const questionIds = flattenedData.map(item => item.questionId);
        return Array.from(new Set(questionIds));
    }

    async lastWeekUpdatedQuestionByUserId(userId: number, financialYearId: number) {
        const currentDate = new Date();
        const last7Days = new Date(currentDate);
        last7Days.setDate(currentDate.getDate() - 7);

        const updatedAnswers = await Promise.all([
            this.dataSource.getRepository(SectorQuestionAnswerEntity).find({
                where: {
                    userId,
                    updatedAt: Between(last7Days, currentDate),
                    financialYearId
                },
            }),
            this.dataSource.getRepository(SectorQuestionTrendsAnswerEntity).find({
                where: {
                    userId,
                    updatedAt: Between(last7Days, currentDate),
                    financialYearId
                },
            }),
            this.dataSource.getRepository(SectorQuestionTabularAnswerEntity).find({
                where: {
                    userId,
                    updatedAt: Between(last7Days, currentDate),
                    financialYearId
                },
            }),
        ]);

        const flattenedData = updatedAnswers.flat();
        const questionIds = flattenedData.map(item => item.questionId);
        return Array.from(new Set(questionIds));
    }

    async lastWeekPendingQuestionByUserId(assignedTo: number, financialYearId: number) {
        const currentDate = new Date();
        const next7Days = new Date(currentDate);
        next7Days.setDate(currentDate.getDate() - 7);

        const dueQuestion = await this.dataSource.getRepository(AssignQuestionEntity).find({
            where: {
                assignedTo: In([assignedTo]),
                dueDate: Between(next7Days, currentDate),
                answerable: true,
                financialYearId
            },
        });
        const questionIds = dueQuestion.map(item => item.questionId);
        return Array.from(new Set(questionIds));
        // let doneQuestion = this.dataSource.getRepository(AuditListingEntity).find({ where: { auditerId } });
        // return doneQuestion;
    }

    async nextWeekDueQuestionByUserId(assignedTo: number, financialYearId: number) {
        const currentDate = new Date();
        const next7Days = new Date(currentDate);
        next7Days.setDate(currentDate.getDate() + 7);

        const dueQuestion = await this.dataSource.getRepository(AssignQuestionEntity).find({
            where: {
                assignedTo: In([assignedTo]),
                dueDate: Between(currentDate, next7Days),
                answerable: true,
                financialYearId
            },
        });
        const questionIds = dueQuestion.map(item => item.questionId);
        return Array.from(new Set(questionIds));
    }
    async doneALLQuestionByUserId(auditStatus: QuestionStatus, financialYearId: number) {
        const currentDate = new Date();
        const last7Days = new Date(currentDate);
        last7Days.setDate(currentDate.getDate() - 7);
        const updatedAnswers = await Promise.all([
            this.dataSource.getRepository(SectorQuestionAnswerEntity).find({
                where: {
                    updatedAt: Between(last7Days, currentDate),
                    status: "ACCEPTED" as QuestionStatus,
                    financialYearId
                },
            }),
            this.dataSource.getRepository(SectorQuestionTrendsAnswerEntity).find({
                where: {
                    updatedAt: Between(last7Days, currentDate),
                    status: "ACCEPTED" as QuestionStatus,
                    financialYearId
                },
            }),
            this.dataSource.getRepository(SectorQuestionTabularAnswerEntity).find({
                where: {
                    updatedAt: Between(last7Days, currentDate),
                    status: "ACCEPTED" as QuestionStatus,
                    financialYearId
                },
            }),
        ]);
        const flattenedData = updatedAnswers.flat();
        const questionIds = flattenedData.map(item => item.questionId);
        return Array.from(new Set(questionIds));
    }

    async lastWeekAllUpdatedQuestionByUserId(financialYearId: number) {
        const currentDate = new Date();
        const last7Days = new Date(currentDate);
        last7Days.setDate(currentDate.getDate() - 7);

        const updatedAnswers = await Promise.all([
            this.dataSource.getRepository(SectorQuestionAnswerEntity).find({
                where: {
                    updatedAt: Between(last7Days, currentDate), financialYearId
                },
            }),
            this.dataSource.getRepository(SectorQuestionTrendsAnswerEntity).find({
                where: {
                    updatedAt: Between(last7Days, currentDate), financialYearId
                },
            }),
            this.dataSource.getRepository(SectorQuestionTabularAnswerEntity).find({
                where: {
                    updatedAt: Between(last7Days, currentDate), financialYearId
                },
            }),
        ]);

        const flattenedData = updatedAnswers.flat();
        const questionIds = flattenedData.map(item => item.questionId);
        return Array.from(new Set(questionIds));
    }

    async lastWeekAllPendingQuestionByUserId() {
        const currentDate = new Date();
        const next7Days = new Date(currentDate);
        next7Days.setDate(currentDate.getDate() - 7);

        const dueQuestion = await this.dataSource.getRepository(AssignQuestionEntity).find({
            where: {
                dueDate: Between(next7Days, currentDate),
                answerable: true
            },
        });
        const questionIds = dueQuestion.map(item => item.questionId);
        return Array.from(new Set(questionIds));
        // let doneQuestion = this.dataSource.getRepository(AuditListingEntity).find({ where: { auditerId } });
        // return doneQuestion;
    }

    async nextWeekAllDueQuestionByUserId() {
        const currentDate = new Date();
        const next7Days = new Date(currentDate);
        next7Days.setDate(currentDate.getDate() + 7);

        const dueQuestion = await this.dataSource.getRepository(AssignQuestionEntity).find({
            where: {
                dueDate: Between(currentDate, next7Days),
                answerable: true
            },
        });
        let questionIds = dueQuestion.map(item => item.questionId);

        const updatedAnswers = await Promise.all([
            this.dataSource.getRepository(SectorQuestionAnswerEntity).find({
                where: {

                },
            }),


        ]);

        const flattenedData = updatedAnswers.flat();
        const updatedQuestionIds = new Set(flattenedData.map(item => item.questionId));

        // Remove questionIds present in updatedQuestionIds
        questionIds = questionIds.filter(questionId => !updatedQuestionIds.has(questionId));

        return questionIds;
    }

    async todaysActivity(userId: number) {
        const currentDate = new Date();
        const startOfToday = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
        const endOfToday = new Date(startOfToday);
        endOfToday.setDate(startOfToday.getDate() + 1);
        await this.dataSource.getRepository(TodaysActivity).delete({
            userId,
            createdAt: Between(startOfToday, endOfToday),
        });
        const todaysActivity = await this.dataSource.getRepository(TodaysActivity).find({
            where: { userId },
        });

        return todaysActivity;
    }
    async todaysAllActivity() {
        const todaysActivity = await this.dataSource.getRepository(TodaysActivity).find({
            where: {},
        });

        return todaysActivity;
    }


    async insertTodaysActivityData(todaysActivity: TodaysActivity) {
        return await this.dataSource
            .getRepository(TodaysActivity)
            .save(todaysActivity);
    }

    async answeredFramworkIdsData(userId: number, frameworkId: number, financialYearId: number) {
        const answeredData = await Promise.all([
            this.dataSource.getRepository(SectorQuestionAnswerEntity).find({
                where: {
                    userId,
                    frameworkId,
                    financialYearId,
                    status: "ANSWERED" as QuestionStatus
                },
            }),
            this.dataSource.getRepository(SectorQuestionTrendsAnswerEntity).find({
                where: {
                    userId,
                    frameworkId,
                    financialYearId,
                    status: "ANSWERED" as QuestionStatus
                },
            }),
            this.dataSource.getRepository(SectorQuestionTabularAnswerEntity).find({
                where: {
                    userId,
                    frameworkId,
                    financialYearId,
                    status: "ANSWERED" as QuestionStatus
                },
            }),

        ]);
        const flattenedData = answeredData.flat();
        const questionIds = flattenedData.map(item => item.questionId);
        return Array.from(new Set(questionIds));
    }

    async answeredReportingIdsData(finalAssgnedQuestion: number[], financialYearId: number) {
        const answeredData = await Promise.all([
            this.dataSource.getRepository(ReportingQuestionAnswerEntity).find({
                where: {
                    questionId: In(finalAssgnedQuestion),
                    financialYearId,
                    status: In(["ANSWERED", "ACCEPTED"] as QuestionStatus[]),
                },
            }),

        ]);
        const flattenedData = answeredData.flat();
        const questionIds = flattenedData.map(item => item.questionId);
        return Array.from(questionIds);
    }

    async answeredReportingIdsDatas(finalAssgnedQuestion: number[], financialYearId: number, totalAnsweredForThisPeriods: number[]) {
        const answeredData = await Promise.all([
            this.dataSource.getRepository(ReportingQuestionAnswerEntity).find({
                where: {
                    questionId: In(finalAssgnedQuestion),
                    id: In(totalAnsweredForThisPeriods),
                    financialYearId,
                    status: In(["ANSWERED", "ACCEPTED"] as QuestionStatus[]),
                },
            }),

        ]);
        const flattenedData = answeredData.flat();
        const questionIds = flattenedData.map(item => item.questionId);
        return Array.from(questionIds);
    }

    async answeredReportingIds(finalAssgnedQuestion: number[], financialYearId: number, totalAnsweredForThisPeriods: number[], sourceIds: number[], subLocationId: number | null) {
        const where: any = {
            questionId: In(finalAssgnedQuestion),
            sourceId: In(sourceIds),
            id: In(totalAnsweredForThisPeriods),
            financialYearId,
            status: In(["ANSWERED", "ACCEPTED"] as QuestionStatus[]),
        };

        // ✅ Apply subLocationId filter conditionally
        if (subLocationId != null && sourceIds.length === 1) {
            where.subLocationId = subLocationId;
        }

        const answeredData = await this.dataSource
            .getRepository(ReportingQuestionAnswerEntity)
            .find({ where });

        const questionIds = answeredData.map((item) => item.questionId);
        return Array.from(questionIds);
    }

    async answeredReportingAnsweredIds( financialYearId: number, totalAnsweredForThisPeriods: number[], sourceIds: number[], subLocationId: number | null) {
        const where: any = {
            sourceId: In(sourceIds),
            id: In(totalAnsweredForThisPeriods),
            financialYearId,
            status: In(["ANSWERED", "ACCEPTED"] as QuestionStatus[]),
        }

        // ✅ Apply subLocationId filter conditionally
        if (subLocationId != null && sourceIds.length === 1) {
            where.subLocationId = subLocationId;
        }

        const answeredData = await this.dataSource.getRepository(ReportingQuestionAnswerEntity).find({ where });
        const questionIds = answeredData.map(item => item.id);
        return Array.from(questionIds);
    }

    async acceptedReportingIdsData(userId: number, financialYearId: number, fromDate: string, toDate: string) {
        const answeredData = await Promise.all([
            this.dataSource.getRepository(ReportingQuestionAnswerEntity).find({
                where: {
                    userId,
                    financialYearId,
                    fromDate: In([fromDate, '']),
                    toDate: In([toDate, '']),
                    status: "ACCEPTED" as QuestionStatus
                },
            }),


        ]);
        const flattenedData = answeredData.flat();
        const questionIds = flattenedData.map(item => item.questionId);
        return Array.from(new Set(questionIds));
    }

    async rejectedReportingIdsData(userId: number, financialYearId: number, fromDate: string, toDate: string) {
        const answeredData = await Promise.all([
            this.dataSource.getRepository(ReportingQuestionAnswerEntity).find({
                where: {
                    userId,
                    financialYearId,
                    fromDate: In([fromDate, '']),
                    toDate: In([toDate, '']),
                    status: "REJECTED" as QuestionStatus
                },
            }),


        ]);
        const flattenedData = answeredData.flat();
        const questionIds = flattenedData.map(item => item.questionId);
        return Array.from(new Set(questionIds));
    }

    async acceptedFramworkIdsData(userId: number, frameworkId: number, financialYearId: number) {
        const answeredData = await Promise.all([
            this.dataSource.getRepository(SectorQuestionAnswerEntity).find({
                where: {
                    userId,
                    frameworkId,
                    financialYearId,
                    status: "ACCEPTED" as QuestionStatus
                },
            }),
            this.dataSource.getRepository(SectorQuestionTrendsAnswerEntity).find({
                where: {
                    userId,
                    frameworkId,
                    financialYearId,
                    status: "ACCEPTED" as QuestionStatus
                },
            }),
            this.dataSource.getRepository(SectorQuestionTabularAnswerEntity).find({
                where: {
                    userId,
                    frameworkId,
                    financialYearId,
                    status: "ACCEPTED" as QuestionStatus
                },
            }),

        ]);
        const flattenedData = answeredData.flat();
        const questionIds = flattenedData.map(item => item.questionId);
        return Array.from(new Set(questionIds));
    }

    async answeredFramworkAllIdsData(frameworkId: number, financialYearId: number) {
        const answeredData = await Promise.all([
            this.dataSource.getRepository(SectorQuestionAnswerEntity).find({
                where: {
                    frameworkId,
                    financialYearId,
                    status: "ANSWERED" as QuestionStatus
                },
            }),
            this.dataSource.getRepository(SectorQuestionTrendsAnswerEntity).find({
                where: {
                    frameworkId,
                    financialYearId,
                    status: "ANSWERED" as QuestionStatus
                },
            }),
            this.dataSource.getRepository(SectorQuestionTabularAnswerEntity).find({
                where: {
                    frameworkId,
                    financialYearId,
                    status: "ANSWERED" as QuestionStatus
                },
            }),

        ]);
        const flattenedData = answeredData.flat();
        const questionIds = flattenedData.map(item => item.questionId);
        return Array.from(new Set(questionIds));
    }

    async answeredReportingAllIdsDataForEveryFY(financialYearId: number, location: number[], questionIds: Number[]) {
        const answeredData = await Promise.all([
            this.dataSource.getRepository(ReportingQuestionAnswerEntity).find({
                where: {
                    financialYearId,
                    questionId: In(questionIds),
                    // sourceId: In(location),
                    // status: "ANSWERED" as QuestionStatus
                },
            }),
        ]);

        const flattenedData = answeredData.flat();

        // Use Set for uniqueness
        const questionIdSet = new Set(flattenedData.map(item => item.questionId));
        const answerIdSet = new Set(flattenedData.map(item => item.id));

        return {
            questionIds: Array.from(questionIdSet),
            answerIds: Array.from(answerIdSet)
        };
    }


    async answeredReportingAllIdsDataForCustom(financialYearId: number, fromDate: string[], location: number[], questionIds: Number[]) {
        const answeredData = await Promise.all([
            this.dataSource.getRepository(ReportingQuestionAnswerEntity).find({
                where: {
                    financialYearId,
                    fromDate: In([...fromDate, '']),
                    questionId: In(questionIds),
                    sourceId: In(location),
                    // status: "ANSWERED" as QuestionStatus
                },
            }),
        ]);
        const flattenedData = answeredData.flat();
        const questionId = flattenedData.map(item => item.questionId);
        const answerIds = flattenedData.map(item => item.id);
        return {
            questionIds: Array.from(questionId),
            answerIds: Array.from(answerIds)
        }
    }

    async answeredReportingAllIdsData(financialYearId: number, fromDate: string[], location: number[]) {
        const answeredData = await Promise.all([
            this.dataSource.getRepository(ReportingQuestionAnswerEntity).find({
                where: {
                    financialYearId,
                    fromDate: In([...fromDate, '']),
                    // sourceId: In(location),
                    // status: "ANSWERED" as QuestionStatus
                },
            }),
        ]);
        const flattenedData = answeredData.flat();
        const questionIds = flattenedData.map(item => item.questionId);
        return Array.from(new Set(questionIds));
    }

    async answeredReportingAllIdsDataForThisPeriods(financialYearId: number, fromDate: string[], location: number[]) {
        const answeredData = await Promise.all([
            this.dataSource.getRepository(ReportingQuestionAnswerEntity).find({
                where: {
                    financialYearId,
                    fromDate: In([...fromDate, '']),
                    // sourceId: In(location),
                    // status: "ANSWERED" as QuestionStatus
                },
            }),
        ]);
        const flattenedData = answeredData.flat();
        const answerIds = flattenedData.map(item => item.id);
        return Array.from(new Set(answerIds));
    }


    async acceptedFramworkAllIdsData(frameworkId: number, financialYearId: number) {
        const answeredData = await Promise.all([
            this.dataSource.getRepository(SectorQuestionAnswerEntity).find({
                where: {
                    frameworkId,
                    financialYearId,
                    status: "ACCEPTED" as QuestionStatus
                },
            }),
            this.dataSource.getRepository(SectorQuestionTrendsAnswerEntity).find({
                where: {
                    frameworkId,
                    financialYearId,
                    status: "ACCEPTED" as QuestionStatus
                },
            }),
            this.dataSource.getRepository(SectorQuestionTabularAnswerEntity).find({
                where: {
                    frameworkId,
                    financialYearId,
                    status: "ACCEPTED" as QuestionStatus
                },
            }),

        ]);
        const flattenedData = answeredData.flat();
        const questionIds = flattenedData.map(item => item.questionId);
        return Array.from(new Set(questionIds));
    }

    async acceptedReportingAllIdsData(financialYearId: number, fromDate: string, toDate: string) {
        const answeredData = await Promise.all([
            this.dataSource.getRepository(ReportingQuestionAnswerEntity).find({
                where: {
                    financialYearId,
                    fromDate: In([fromDate, '']),
                    toDate: In([toDate, '']),
                    status: "ACCEPTED" as QuestionStatus
                },
            }),


        ]);
        const flattenedData = answeredData.flat();
        const questionIds = flattenedData.map(item => item.questionId);
        return Array.from(new Set(questionIds));
    }

    async acceptedFramworkIdsDataBasedOnId(frameworkId: number) {
        const answeredData = await Promise.all([
            this.dataSource.getRepository(SectorQuestionAnswerEntity).find({
                where: {
                    frameworkId,
                    status: "ACCEPTED" as QuestionStatus
                },
            }),
            this.dataSource.getRepository(SectorQuestionTrendsAnswerEntity).find({
                where: {
                    frameworkId,
                    status: "ACCEPTED" as QuestionStatus
                },
            }),
            this.dataSource.getRepository(SectorQuestionTabularAnswerEntity).find({
                where: {
                    frameworkId,
                    status: "ACCEPTED" as QuestionStatus
                },
            }),

        ]);
        const flattenedData = answeredData.flat();
        const questionIds = flattenedData.map(item => item.questionId);
        return Array.from(new Set(questionIds));
    }

    async rejectedFramworkIdsData(userId: number, frameworkId: number, financialYearId: number) {
        const answeredData = await Promise.all([
            this.dataSource.getRepository(SectorQuestionAnswerEntity).find({
                where: {
                    userId,
                    frameworkId,
                    financialYearId,
                    status: "REJECTED" as QuestionStatus
                },
            }),
            this.dataSource.getRepository(SectorQuestionTrendsAnswerEntity).find({
                where: {
                    userId,
                    frameworkId,
                    financialYearId,
                    status: "REJECTED" as QuestionStatus
                },
            }),
            this.dataSource.getRepository(SectorQuestionTabularAnswerEntity).find({
                where: {
                    userId,
                    frameworkId,
                    financialYearId,
                    status: "REJECTED" as QuestionStatus
                },
            }),

        ]);
        const flattenedData = answeredData.flat();
        const questionIds = flattenedData.map(item => item.questionId);
        return Array.from(new Set(questionIds));
    }
    async rejectedFramworkAllIdsData(frameworkId: number, financialYearId: number) {
        const answeredData = await Promise.all([
            this.dataSource.getRepository(SectorQuestionAnswerEntity).find({
                where: {
                    frameworkId,
                    financialYearId,
                    status: "REJECTED" as QuestionStatus
                },
            }),
            this.dataSource.getRepository(SectorQuestionTrendsAnswerEntity).find({
                where: {
                    frameworkId,
                    financialYearId,
                    status: "REJECTED" as QuestionStatus
                },
            }),
            this.dataSource.getRepository(SectorQuestionTabularAnswerEntity).find({
                where: {
                    frameworkId,
                    financialYearId,
                    status: "REJECTED" as QuestionStatus
                },
            }),

        ]);
        const flattenedData = answeredData.flat();
        const questionIds = flattenedData.map(item => item.questionId);
        return Array.from(new Set(questionIds));
    }

    async rejectedReportingAllIdsData(financialYearId: number, fromDate: string, toDate: string) {
        const answeredData = await Promise.all([
            this.dataSource.getRepository(ReportingQuestionAnswerEntity).find({
                where: {
                    financialYearId,
                    fromDate: In([fromDate, '']),
                    toDate: In([toDate, '']),
                    status: "REJECTED" as QuestionStatus
                },
            }),


        ]);
        const flattenedData = answeredData.flat();
        const questionIds = flattenedData.map(item => item.questionId);
        return Array.from(new Set(questionIds));
    }

    async trendsAnsweredData(userId: number) {
        const answeredData = await Promise.all([
            this.dataSource.getRepository(SectorQuestionTrendsAnswerEntity).find({
                where: {
                    userId,
                    status: "ANSWERED" as QuestionStatus
                },
            }),

        ]);
        return answeredData.flat();
    }

    async tabularAnsweredData(userId: number) {
        const answeredData = await Promise.all([
            this.dataSource.getRepository(SectorQuestionTabularAnswerEntity).find({
                where: {
                    userId,
                    status: "ANSWERED" as QuestionStatus
                },
            }),
        ]);
        return answeredData.flat();
    }

    async answeredData(userId: number, financialYearId: number) {
        const answeredData = await Promise.all([
            this.dataSource.getRepository(SectorQuestionAnswerEntity).find({
                where: {
                    userId,
                    financialYearId,
                    status: "ANSWERED" as QuestionStatus
                },
            }),
            this.dataSource.getRepository(SectorQuestionTrendsAnswerEntity).find({
                where: {
                    userId,
                    financialYearId,
                    status: "ANSWERED" as QuestionStatus
                },
            }),
            this.dataSource.getRepository(SectorQuestionTabularAnswerEntity).find({
                where: {
                    userId,
                    financialYearId,
                    status: "ANSWERED" as QuestionStatus
                },
            }),
        ]);
        const flattenedData = answeredData.flat();
        const questionIds = flattenedData.map(item => item.questionId);
        return answeredData.flat();
    }

    async acceptedAnswerData(userId: number, financialYearId: number) {
        const answeredData = await Promise.all([
            this.dataSource.getRepository(SectorQuestionAnswerEntity).find({
                where: {
                    userId,
                    financialYearId,
                    status: "ACCEPTED" as QuestionStatus
                },
            }),
            this.dataSource.getRepository(SectorQuestionTrendsAnswerEntity).find({
                where: {
                    userId,
                    financialYearId,
                    status: "ACCEPTED" as QuestionStatus
                },
            }),
            this.dataSource.getRepository(SectorQuestionTabularAnswerEntity).find({
                where: {
                    userId,
                    financialYearId,
                    status: "ACCEPTED" as QuestionStatus
                },
            }),
        ]);
        const flattenedData = answeredData.flat();
        const questionIds = flattenedData.map(item => item.questionId);
        return answeredData.flat();
    }

    async rejectedANsweredData(userId: number, financialYearId: number) {
        const answeredData = await Promise.all([
            this.dataSource.getRepository(SectorQuestionAnswerEntity).find({
                where: {
                    userId,
                    financialYearId,
                    status: "REJECTED" as QuestionStatus
                },
            }),
            this.dataSource.getRepository(SectorQuestionTrendsAnswerEntity).find({
                where: {
                    userId,
                    financialYearId,
                    status: "REJECTED" as QuestionStatus
                },
            }),
            this.dataSource.getRepository(SectorQuestionTabularAnswerEntity).find({
                where: {
                    userId,
                    financialYearId,
                    status: "REJECTED" as QuestionStatus
                },
            }),
        ]);
        const flattenedData = answeredData.flat();
        const questionIds = flattenedData.map(item => item.questionId);
        return answeredData.flat();
    }
    async reportingAnsweredData(userId: number, financialYearId: number, fromDate: string, toDate: string) {
        const answeredData = await Promise.all([
            this.dataSource.getRepository(ReportingQuestionAnswerEntity).find({
                where: {
                    userId,
                    financialYearId,
                    fromDate: In([fromDate, '']),
                    toDate: In([toDate, '']),
                    status: "ANSWERED" as QuestionStatus
                },
            }),

        ]);
        const flattenedData = answeredData.flat();
        const questionIds = flattenedData.map(item => item.questionId);
        return answeredData.flat();
    }

    async reportingAcceptedAnswerData(userId: number, financialYearId: number, fromDate: string, toDate: string) {
        const answeredData = await Promise.all([
            this.dataSource.getRepository(ReportingQuestionAnswerEntity).find({
                where: {
                    userId,
                    financialYearId,
                    fromDate: In([fromDate, '']),
                    toDate: In([toDate, '']),
                    status: "ACCEPTED" as QuestionStatus
                },
            }),

        ]);
        const flattenedData = answeredData.flat();
        const questionIds = flattenedData.map(item => item.questionId);
        return answeredData.flat();
    }

    async reportingRejectedANsweredData(userId: number, financialYearId: number, fromDate: string, toDate: string) {
        const answeredData = await Promise.all([
            this.dataSource.getRepository(ReportingQuestionAnswerEntity).find({
                where: {
                    userId,
                    financialYearId,
                    fromDate: In([fromDate, '']),
                    toDate: In([toDate, '']),
                    status: "REJECTED" as QuestionStatus
                },
            }),

        ]);
        const flattenedData = answeredData.flat();
        const questionIds = flattenedData.map(item => item.questionId);
        return answeredData.flat();
    }
    async allAnsweredData(financialYearId: number) {
        const answeredData = await Promise.all([
            this.dataSource.getRepository(SectorQuestionAnswerEntity).find({
                where: {
                    financialYearId,
                    status: "ANSWERED" as QuestionStatus
                },
            }),
            this.dataSource.getRepository(SectorQuestionTrendsAnswerEntity).find({
                where: {
                    financialYearId,
                    status: "ANSWERED" as QuestionStatus
                },
            }),
            this.dataSource.getRepository(SectorQuestionTabularAnswerEntity).find({
                where: {
                    financialYearId,
                    status: "ANSWERED" as QuestionStatus
                },
            }),
        ]);
        const flattenedData = answeredData.flat();
        const questionIds = flattenedData.map(item => item.questionId);
        return answeredData.flat();
    }

    async allAcceptedAnswerData(financialYearId: number) {
        const answeredData = await Promise.all([
            this.dataSource.getRepository(SectorQuestionAnswerEntity).find({
                where: {
                    financialYearId,
                    status: "ACCEPTED" as QuestionStatus
                },
            }),
            this.dataSource.getRepository(SectorQuestionTrendsAnswerEntity).find({
                where: {
                    financialYearId,
                    status: "ACCEPTED" as QuestionStatus
                },
            }),
            this.dataSource.getRepository(SectorQuestionTabularAnswerEntity).find({
                where: {
                    financialYearId,
                    status: "ACCEPTED" as QuestionStatus
                },
            }),
        ]);
        const flattenedData = answeredData.flat();
        const questionIds = flattenedData.map(item => item.questionId);
        return answeredData.flat();
    }

    async allRejectedANsweredData(financialYearId: number) {
        const answeredData = await Promise.all([
            this.dataSource.getRepository(SectorQuestionAnswerEntity).find({
                where: {
                    financialYearId,
                    status: "REJECTED" as QuestionStatus
                },
            }),
            this.dataSource.getRepository(SectorQuestionTrendsAnswerEntity).find({
                where: {
                    financialYearId,
                    status: "REJECTED" as QuestionStatus
                },
            }),
            this.dataSource.getRepository(SectorQuestionTabularAnswerEntity).find({
                where: {
                    financialYearId,
                    status: "REJECTED" as QuestionStatus
                },
            }),
        ]);
        const flattenedData = answeredData.flat();
        const questionIds = flattenedData.map(item => item.questionId);
        return answeredData.flat();
    }

    async allReportingAnsweredData(financialYearId: number, fromDate: string, toDate: string) {
        const answeredData = await Promise.all([
            this.dataSource.getRepository(ReportingQuestionAnswerEntity).find({
                where: {
                    financialYearId,
                    fromDate: In([fromDate, '']),
                    toDate: In([toDate, '']),
                    status: "ANSWERED" as QuestionStatus
                },
            }),

        ]);
        const flattenedData = answeredData.flat();
        const questionIds = flattenedData.map(item => item.questionId);
        return answeredData.flat();
    }

    async allReportingAcceptedAnswerData(financialYearId: number, fromDate: string, toDate: string) {
        const answeredData = await Promise.all([
            this.dataSource.getRepository(ReportingQuestionAnswerEntity).find({
                where: {
                    financialYearId,
                    fromDate: In([fromDate, '']),
                    toDate: In([toDate, '']),
                    status: "ACCEPTED" as QuestionStatus
                },
            }),

        ]);
        const flattenedData = answeredData.flat();
        const questionIds = flattenedData.map(item => item.questionId);
        return answeredData.flat();
    }

    async allReportingRejectedANsweredData(financialYearId: number, fromDate: string, toDate: string) {
        const answeredData = await Promise.all([
            this.dataSource.getRepository(ReportingQuestionAnswerEntity).find({
                where: {
                    financialYearId,
                    fromDate: In([fromDate, '']),
                    toDate: In([toDate, '']),
                    status: "REJECTED" as QuestionStatus
                },
            }),

        ]);
        const flattenedData = answeredData.flat();
        const questionIds = flattenedData.map(item => item.questionId);
        return answeredData.flat();
    }

    async answeredLocationIdData(sourceId: number, financialYearId: number) {
        const answeredData = await Promise.all([
            this.dataSource.getRepository(SectorQuestionAnswerEntity).find({
                where: {
                    sourceId,
                    financialYearId,
                    status: "ANSWERED" as QuestionStatus
                },
            }),
            this.dataSource.getRepository(SectorQuestionTrendsAnswerEntity).find({
                where: {
                    sourceId,
                    financialYearId,
                    status: "ANSWERED" as QuestionStatus
                },
            }),
            this.dataSource.getRepository(SectorQuestionTabularAnswerEntity).find({
                where: {
                    sourceId,
                    financialYearId,
                    status: "ANSWERED" as QuestionStatus
                },
            }),

        ]);
        const flattenedData = answeredData.flat();
        const questionIds = flattenedData.map(item => item.questionId);
        return Array.from(new Set(questionIds));
    }

    async acceptedAnswerLocationIdData(sourceId: number, financialYearId: number) {
        const answeredData = await Promise.all([
            this.dataSource.getRepository(SectorQuestionAnswerEntity).find({
                where: {
                    sourceId,
                    financialYearId,
                    status: "ACCEPTED" as QuestionStatus
                },
            }),
            this.dataSource.getRepository(SectorQuestionTrendsAnswerEntity).find({
                where: {
                    sourceId,
                    financialYearId,
                    status: "ACCEPTED" as QuestionStatus
                },
            }),
            this.dataSource.getRepository(SectorQuestionTabularAnswerEntity).find({
                where: {
                    sourceId,
                    financialYearId,
                    status: "ACCEPTED" as QuestionStatus
                },
            }),

        ]);
        const flattenedData = answeredData.flat();
        const questionIds = flattenedData.map(item => item.questionId);
        return Array.from(new Set(questionIds));
    }

    async rejectedANsweredLocationIdData(sourceId: number, financialYearId: number) {
        const answeredData = await Promise.all([
            this.dataSource.getRepository(SectorQuestionAnswerEntity).find({
                where: {
                    sourceId,
                    financialYearId,
                    status: "REJECTED" as QuestionStatus
                },
            }),
            this.dataSource.getRepository(SectorQuestionTrendsAnswerEntity).find({
                where: {
                    sourceId,
                    financialYearId,
                    status: "REJECTED" as QuestionStatus
                },
            }),
            this.dataSource.getRepository(SectorQuestionTabularAnswerEntity).find({
                where: {
                    sourceId,
                    financialYearId,
                    status: "REJECTED" as QuestionStatus
                },
            }),

        ]);
        const flattenedData = answeredData.flat();
        const questionIds = flattenedData.map(item => item.questionId);
        return Array.from(new Set(questionIds));
    }

    async answeredLocationReportingData(sourceId: number, financialYearId: number, fromDate: string, toDate: string) {
        const answeredData = await Promise.all([
            this.dataSource.getRepository(ReportingQuestionAnswerEntity).find({
                where: {
                    sourceId,
                    financialYearId,
                    fromDate: In([fromDate, '']),
                    toDate: In([toDate, '']),
                    status: "ANSWERED" as QuestionStatus
                },
            }),


        ]);
        const flattenedData = answeredData.flat();
        const questionIds = flattenedData.map(item => item.questionId);
        return Array.from(new Set(questionIds));
    }

    async acceptedAnswerLocationReportingData(sourceId: number, financialYearId: number, fromDate: string, toDate: string) {
        const answeredData = await Promise.all([
            this.dataSource.getRepository(ReportingQuestionAnswerEntity).find({
                where: {
                    sourceId,
                    financialYearId,
                    fromDate: In([fromDate, '']),
                    toDate: In([toDate, '']),
                    status: "ACCEPTED" as QuestionStatus
                },
            }),


        ]);
        const flattenedData = answeredData.flat();
        const questionIds = flattenedData.map(item => item.questionId);
        return Array.from(new Set(questionIds));
    }

    async rejectedANsweredLocationReportingData(sourceId: number, financialYearId: number, fromDate: string, toDate: string) {
        const answeredData = await Promise.all([
            this.dataSource.getRepository(ReportingQuestionAnswerEntity).find({
                where: {
                    sourceId,
                    financialYearId,
                    fromDate: In([fromDate, '']),
                    toDate: In([toDate, '']),
                    status: "REJECTED" as QuestionStatus
                },
            }),


        ]);
        const flattenedData = answeredData.flat();
        const questionIds = flattenedData.map(item => item.questionId);
        return Array.from(new Set(questionIds));
    }

    async answeredLocationIdDataForHeadOffice(financialYearId: number) {
        const answeredData = await Promise.all([
            this.dataSource.getRepository(SectorQuestionAnswerEntity).find({
                where: {
                    financialYearId,
                    status: "ANSWERED" as QuestionStatus
                },
            }),
            this.dataSource.getRepository(SectorQuestionTrendsAnswerEntity).find({
                where: {
                    financialYearId,
                    status: "ANSWERED" as QuestionStatus
                },
            }),
            this.dataSource.getRepository(SectorQuestionTabularAnswerEntity).find({
                where: {
                    financialYearId,
                    status: "ANSWERED" as QuestionStatus
                },
            }),

        ]);
        const flattenedData = answeredData.flat();
        const questionIds = flattenedData.map(item => item.questionId);
        return Array.from(new Set(questionIds));
    }

    async acceptedAnswerLocationIdDataForHeadOffice(financialYearId: number) {
        const answeredData = await Promise.all([
            this.dataSource.getRepository(SectorQuestionAnswerEntity).find({
                where: {
                    financialYearId,
                    status: "ACCEPTED" as QuestionStatus
                },
            }),
            this.dataSource.getRepository(SectorQuestionTrendsAnswerEntity).find({
                where: {
                    financialYearId,
                    status: "ACCEPTED" as QuestionStatus
                },
            }),
            this.dataSource.getRepository(SectorQuestionTabularAnswerEntity).find({
                where: {
                    financialYearId,
                    status: "ACCEPTED" as QuestionStatus
                },
            }),

        ]);
        const flattenedData = answeredData.flat();
        const questionIds = flattenedData.map(item => item.questionId);
        return Array.from(new Set(questionIds));
    }

    async rejectedANsweredLocationIdDataForHeadOffice(financialYearId: number) {
        const answeredData = await Promise.all([
            this.dataSource.getRepository(SectorQuestionAnswerEntity).find({
                where: {
                    financialYearId,
                    status: "REJECTED" as QuestionStatus
                },
            }),
            this.dataSource.getRepository(SectorQuestionTrendsAnswerEntity).find({
                where: {
                    financialYearId,
                    status: "REJECTED" as QuestionStatus
                },
            }),
            this.dataSource.getRepository(SectorQuestionTabularAnswerEntity).find({
                where: {
                    financialYearId,
                    status: "REJECTED" as QuestionStatus
                },
            }),

        ]);
        const flattenedData = answeredData.flat();
        const questionIds = flattenedData.map(item => item.questionId);
        return Array.from(new Set(questionIds));
    }

    async answeredLocationReportingDataForHeadOffice(financialYearId: number, fromDate: string, toDate: string) {
        const answeredData = await Promise.all([
            this.dataSource.getRepository(ReportingQuestionAnswerEntity).find({
                where: {
                    financialYearId,
                    fromDate: In([fromDate, '']),
                    toDate: In([toDate, '']),
                    status: "ANSWERED" as QuestionStatus
                },
            })

        ]);
        const flattenedData = answeredData.flat();
        const questionIds = flattenedData.map(item => item.questionId);
        return Array.from(new Set(questionIds));
    }

    async acceptedAnswerLocationReportingDataForHeadOffice(financialYearId: number, fromDate: string, toDate: string) {
        const answeredData = await Promise.all([
            this.dataSource.getRepository(ReportingQuestionAnswerEntity).find({
                where: {
                    financialYearId,
                    fromDate: In([fromDate, '']),
                    toDate: In([toDate, '']),
                    status: "ACCEPTED" as QuestionStatus
                },
            })

        ]);
        const flattenedData = answeredData.flat();
        const questionIds = flattenedData.map(item => item.questionId);
        return Array.from(new Set(questionIds));
    }

    async rejectedAnsweredLocationReportingDataForHeadOffice(financialYearId: number, fromDate: string, toDate: string) {
        const answeredData = await Promise.all([
            this.dataSource.getRepository(ReportingQuestionAnswerEntity).find({
                where: {
                    financialYearId,
                    fromDate: In([fromDate, '']),
                    toDate: In([toDate, '']),
                    status: "REJECTED" as QuestionStatus
                },
            }),
        ]);
        const flattenedData = answeredData.flat();
        const questionIds = flattenedData.map(item => item.questionId);
        return Array.from(new Set(questionIds));
    }

    async getQuestionAssignedIds(assignedToId: number, financialYearId: number) {
        const assignedDetails = await this.getRepo(AssignQuestionEntity).find({
            where: [
                { assignedTo: Like(`%,${assignedToId},%`), financialYearId: financialYearId },
                { assignedTo: Like(`${assignedToId},%`), financialYearId: financialYearId },
                { assignedTo: Like(`%,${assignedToId}`), financialYearId: financialYearId },
                { assignedTo: assignedToId.toString(), financialYearId: financialYearId }
            ],
            //   where: { assignedTo: assignedToId, financialYearId },
            //   { viewAuditUser: Like(`%,${userId},%`), financialYearId: financialYearId },
            //   { viewAuditUser: Like(`${userId},%`), financialYearId: financialYearId },
            //   { viewAuditUser: Like(`%,${userId}`), financialYearId: financialYearId },
            //   { viewAuditUser: userId.toString(), financialYearId: financialYearId }
            select: ['questionId', 'financialYearId'],
        });
        const questionIds = assignedDetails.map((details) => details.questionId);
        return Array.from(new Set(questionIds));
    }

    async getQuestionMultipleUserAssignedIds(assignedToIds: number[], financialYearId: number) {
        const assignedDetails = await this.getRepo(AssignQuestionEntity).find({
            where: {
                assignedTo: In(assignedToIds), // Use In() for arrays
                financialYearId: financialYearId
            },
            select: ['questionId']
        });
        const questionIds = [...new Set(assignedDetails.map((details) => details.questionId))];
        return questionIds;
    }



    async getQuestionAuditedIdsWithAnswer(financialYearId: number, answerIds: number[]) {
        const assignedDetails = await this.getRepo(AuditListingEntity).find({
            where: {
                financialYearId,
                answerId: In(answerIds),
            },
            select: ['questionId', 'financialYearId', 'remark', 'auditerId','answerId'],
        });

        return assignedDetails;
    }

    async getQuestionAuditedIds(financialYearId: number) {
        const assignedDetails = await this.getRepo(AuditListingEntity).find({
            where: {
                financialYearId,
            },
            select: ['questionId', 'financialYearId', 'remark', 'auditerId'],
        });

        return assignedDetails;
    }


    async getAssignedIds(financialYearId: number) {
        const assignedDetails = await this.getRepo(AssignQuestionEntity).find({
            where: { financialYearId },
            select: ['questionId'],
        });
        const questionIds = assignedDetails.map((details) => details.questionId);
        return Array.from(new Set(questionIds));
    }
    async getGraphFilterForUser(userId: number, graphName: string) {
        return this.getRepo(GraphFilterEntity).findOne({ where: { userId, graphName } });
    }

    async insertGraphFilter(graphFilterEntity: GraphFilterEntity) {
        return this.getRepo(GraphFilterEntity).save(graphFilterEntity);
    }

    async updateGraphFilter(graphName: string, userId: number, filter: string) {
        return this.getRepo(GraphFilterEntity).update({ graphName, userId }, { filter });
    }
}
