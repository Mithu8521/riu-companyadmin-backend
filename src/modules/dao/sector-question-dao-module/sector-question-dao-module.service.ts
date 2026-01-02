import { ReportingQuestionAnswerEntity } from '@modules/reporting_module/entities/reporting_question_answer.entity';
import { AssignQuestionEntity } from '@modules/sector_question/entities/assign_question.entity';
import { SectorQuestionAnswerEntity } from '@modules/sector_question/entities/sector_question_answers.entity';
import { SectorQuestionHistoryAnswerEntity } from '@modules/sector_question/entities/sector_question_answers_history.entity';
import { SectorQuestionTrendsAnswerEntity } from '@modules/sector_question/entities/sector_question_trends_answer.entity';
import { SectorQuestionTrendsHistoryAnswerEntity } from '@modules/sector_question/entities/sector_question_trends_answer_history.entity';
import { SectorQuestionTabularAnswerEntity } from '@modules/sector_question/entities/sector_tabular_question_answer.entity';
import { SectorQuestionTabularHistoryAnswerEntity } from '@modules/sector_question/entities/sector_tabular_question_answer_history.entity';
import { ReportGenerationSettingEntity } from '@modules/sector_question/entities/report-generation-settings.entity';
import { BadRequestException, Injectable } from '@nestjs/common';
import { bool } from 'aws-sdk/clients/signer';
import { DataSource, In, Like, Raw, Repository } from 'typeorm';
import { ReportGenerationSettingDto } from '@modules/sector_question/dto/report-generation-settings.dto';

@Injectable()
export class SectorQuestionDaoModuleService {
  constructor(private dataSource: DataSource) { }

  private getRepo(entity: any) {
    return this.dataSource.getRepository(entity);
  }

  async createAssign(assignQuestionEntity: AssignQuestionEntity) {
    return this.getRepo(AssignQuestionEntity).save(assignQuestionEntity);
  }

  async updateAssignQuestion(id: number, updatedData: Partial<AssignQuestionEntity>) {
    return this.getRepo(AssignQuestionEntity).update(id, updatedData);
  }

  async getAssignedDetails(qIds: number[], financialYearId: number) {
    return await this.getRepo(AssignQuestionEntity).find({
      where: { questionId: In(qIds), financialYearId: financialYearId, answerable: true },
    });
  }

  async getAssignedDetailsBasedOnAssignedBy(financialYearId: number) {
    return this.getRepo(AssignQuestionEntity).find({
      where: { financialYearId },
    });
  }


  async getAssignedDetailsBasedOnAssignTo(systemUserId: number, params, financialYearId: number) {
    const whereConditions = {
      viewQuestion: Like(`%${systemUserId}%`),
      financialYearId: financialYearId,
    };

    Object.keys(params).forEach(key => {
      if (params[key] instanceof Array) {
        whereConditions[key] = In(params[key]);
      } else {
        whereConditions[key] = params[key];
      }
    });

    return this.getRepo(AssignQuestionEntity).find({
      where: whereConditions,
    });
  }

  // async getQuestionIds(assignedToId: number, financialYearId: number) {
  //   const assignedDetails = await this.getRepo(AssignQuestionEntity).find({
  //     where: {
  //       viewQuestion: Raw(alias => `FIND_IN_SET(${assignedToId}, ${alias})`),
  //       answerable: true,
  //       financialYearId
  //     },
  //     select: ['questionId'],
  //   });
  //   return assignedDetails.map(details => details.questionId);
  // }

  async getQuestionIds(assignedToIds: number[], financialYearId: number) {
    if (!Array.isArray(assignedToIds) || assignedToIds.length === 0) {
      return [];
    }

    const assignedDetails = await this.getRepo(AssignQuestionEntity)
      .createQueryBuilder('assign')
      .select(['assign.questionId'])
      .where(
        assignedToIds
          .map((id) => `FIND_IN_SET(:id${id}, assign.view_question)`)
          .join(' OR ')
      )
      .andWhere('assign.answerable = :answerable', { answerable: true })
      .andWhere('assign.financialYearId = :financialYearId', { financialYearId })
      .setParameters(
        assignedToIds.reduce((params, id) => {
          params[`id${id}`] = id;
          return params;
        }, {})
      )
      .getMany();


    return assignedDetails.map(details => details.questionId);
  }


  async getAllQuestionIds(assignedToId: number[], financialYearId: number) {
    const assignedDetails = await this.getRepo(AssignQuestionEntity).find({
      where: {
        viewQuestion: Raw(alias =>
          assignedToId.map(id => `FIND_IN_SET(${id}, ${alias})`).join(' OR ')
        ),
        answerable: true,
        financialYearId
      },
      select: ['questionId'],
    });

    return assignedDetails.map(details => details.questionId);
  }


  async getAllQuestionId(assignedToId: number[]) {
    const assignedDetails = await this.getRepo(AssignQuestionEntity).find({
      where: {
        viewQuestion: Raw(alias =>
          assignedToId.map(id => `FIND_IN_SET(${id}, ${alias})`).join(' OR ')
        ),
        answerable: true,
      },
      select: ['questionId'],
    });

    return assignedDetails.map(details => details.questionId);
  }


  async getQuestionIdBasesAssignedUser(assignedToId: number) {
    const assignedDetails = await this.getRepo(AssignQuestionEntity).find({
      where: { viewQuestion: Like(`%${assignedToId}%`) },
      select: ['questionId'],
    });
    return assignedDetails.map((details) => details.questionId);
  }

  async getQuestionIdsBasedOnSourceIds(sourceId: number) {
    const assignedDetails = await this.getRepo(AssignQuestionEntity).find({
      where: { sourceIds: Like(`%${sourceId}%`), answerable: true },
      select: ['questionId'],
    });
    return assignedDetails.map((details) => details.questionId);
  }

  async getQuestionIdsBasedOnSourceIdsForHead(financialYearId) {
    const assignedDetails = await this.getRepo(AssignQuestionEntity).find({
      where: { financialYearId, answerable: true },
      select: ['questionId'],
    });
    return assignedDetails.map((details) => details.questionId);
  }

  async getAssignedQuestion(financialYearId) {
    const assignedDetails = await this.getRepo(AssignQuestionEntity).find({
      where: { financialYearId, answerable: true },
    });
    return assignedDetails;
  }

  async getAssignDetailsBasedOnQuestionIdAndAssignedToId(assignedToId: number, questionId: number, financialYearId: number) {
    return this.getRepo(AssignQuestionEntity)
      .createQueryBuilder("assign")
      .where("FIND_IN_SET(:assignedToId, assign.assignedTo) > 0", { assignedToId })
      .andWhere("assign.questionId = :questionId", { questionId })
      .andWhere("assign.financialYearId = :financialYearId", { financialYearId })
      .getOne();
  }

  async getAssignDetailsBasedOnQuestionId(questionId: number, financialYearId: number) {
    return this.getRepo(AssignQuestionEntity).findOne({
      where: { questionId: questionId, financialYearId },
    });
  }

  async getAssignmentByQuestionAndUser(questionId: number, assignedBy: number, financialYearId: number) {
    return this.getRepo(AssignQuestionEntity).findOne({ where: { questionId, assignedBy, financialYearId } });
  }

  async getAssignmentByCurrentAnswerable(questionId: number, answerable: boolean) {
    return this.getRepo(AssignQuestionEntity).findOne({ where: { questionId, answerable } });
  }

  // async getAssignmentByQuestionAndUser(questionId: number, assignedBy: number) {
  //   return this.getRepo(AssignQuestionEntity).findOne({ where: { questionId } });
  // }

  async getExistingRecordAnswer(questionId: number, financialYearId: number) {
    return this.getRepo(SectorQuestionAnswerEntity).findOne({ where: { questionId, financialYearId } });
  }

  async getAllExistingRecordAnswer() {
    return this.getRepo(SectorQuestionAnswerEntity).find();
  }

  async getExistingRecordTabularAnswer(questionId: number, sourceId: number, financialYearId: number) {
    return this.getRepo(SectorQuestionTabularAnswerEntity).findOne({
      where: { questionId, sourceId: Number(sourceId), financialYearId },
    });
  }

  async getAllExistingRecordTabularAnswer() {
    return this.getRepo(SectorQuestionTabularAnswerEntity).find();
  }

  async getExistingRecordTrendsAnswer(questionId: number, dateRangeSourceId: string, financialYearId: number) {
    return this.getRepo(SectorQuestionTrendsAnswerEntity).findOne({
      where: { questionId, dateRangeSourceId, financialYearId },
    });
  }

  async getAllExistingRecordTrendsAnswer() {
    return this.getRepo(SectorQuestionTrendsAnswerEntity).find();
  }

  async getExistingRecordTrendsAnswers(questionId: number, financialYearId: number) {
    return this.getRepo(SectorQuestionTrendsAnswerEntity).findOne({
      where: { questionId, financialYearId },
    });
  }

  async saveSectorQuestionAnswer(sectorQuestionAnswerEntity: SectorQuestionAnswerEntity) {
    return this.getRepo(SectorQuestionAnswerEntity).save(sectorQuestionAnswerEntity);
  }

  async updateSectorQuestionAnswer(questionId: number, financialYearId: number, sectorQuestionAnswerEntity: SectorQuestionAnswerEntity) {
    return this.getRepo(SectorQuestionAnswerEntity).update({ questionId, financialYearId }, sectorQuestionAnswerEntity);
  }

  async saveSectorQuestionTabularAnswer(sectorQuestionTabularAnswerEntity: SectorQuestionTabularAnswerEntity) {
    return this.getRepo(SectorQuestionTabularAnswerEntity).save(sectorQuestionTabularAnswerEntity);
  }

  async updateSectorQuestionTabularAnswer(questionId: number, sourceId: number, financialYearId: number, sectorQuestionTabularAnswerEntity: SectorQuestionTabularAnswerEntity) {
    return this.getRepo(SectorQuestionTabularAnswerEntity).update(
      { questionId, sourceId, financialYearId },
      sectorQuestionTabularAnswerEntity,
    );
  }

  async saveSectorQuestionTrendsAnswer(sectorQuestionTrendsAnswerEntity: SectorQuestionTrendsAnswerEntity) {
    return this.getRepo(SectorQuestionTrendsAnswerEntity).save(sectorQuestionTrendsAnswerEntity);
  }

  async updateSectorQuestionTrendsAnswer(questionId: number, dateRangeSourceId: string, sectorQuestionTrendsAnswerEntity: SectorQuestionTrendsAnswerEntity) {
    return this.getRepo(SectorQuestionTrendsAnswerEntity).update(
      { questionId, dateRangeSourceId },
      sectorQuestionTrendsAnswerEntity,
    );
  }

  async updateSectorQuestionTrendsAnswers(questionId: number, financialYearId: number, sectorQuestionTrendsAnswerEntity: SectorQuestionTrendsAnswerEntity) {
    return this.getRepo(SectorQuestionTrendsAnswerEntity).update(
      { questionId, financialYearId },
      sectorQuestionTrendsAnswerEntity,
    );
  }
  async updateDueDate(questionId: number, dueDate: Date,) {
    return this.getRepo(AssignQuestionEntity).update({ questionId }, { dueDate });
  }

  async updateAnswerable(questionId: number, answerable: boolean,) {
    return this.getRepo(AssignQuestionEntity).update({ questionId, answerable: true }, { answerable });
  }
  async updateAssign(questionId: number, reassignId: number, assignedTo: number[], assignedBy: number, viewQuestion: number[], dueDate: Date) {
    return this.getRepo(AssignQuestionEntity).update(
      { questionId, assignedTo: Like(`%${reassignId}%`) },
      { assignedTo, assignedBy, viewQuestion, dueDate, answerable: true }
    );
  }

  async dueDateRequested(questionId: number, dueDateRequested: boolean, assignedBy: number) {
    return this.getRepo(AssignQuestionEntity).update({ questionId, assignedBy }, { dueDateRequested });
  }

  async updateAllTypeStatus(id: number, status: any) {
    return this.getRepo(SectorQuestionAnswerEntity).update({ id }, { status });
  }

  async updateTrendsStattus(id: number, status: any) {
    return this.getRepo(SectorQuestionTrendsAnswerEntity).update({ id }, { status });
  }

  async updateTabular(id: number, status: any) {
    return this.getRepo(SectorQuestionTabularAnswerEntity).update({ id }, { status });
  }

  async saveSectorQuestionHistoryAnswer(sectorQuestionHistoryAnswerEntity: SectorQuestionHistoryAnswerEntity) {
    return this.getRepo(SectorQuestionHistoryAnswerEntity).save(sectorQuestionHistoryAnswerEntity);
  }

  async saveSectorQuestionTabularHistoryAnswer(
    sectorQuestionTabularHistoryAnswerEntity: SectorQuestionTabularHistoryAnswerEntity,
  ) {
    return this.getRepo(SectorQuestionTabularHistoryAnswerEntity).save(
      sectorQuestionTabularHistoryAnswerEntity,
    );
  }

  async saveSectorQuestionTrendsHistoryAnswer(
    sectorQuestionTrendsHistoryAnswerEntity: SectorQuestionTrendsHistoryAnswerEntity,
  ) {
    return this.getRepo(SectorQuestionTrendsHistoryAnswerEntity).save(
      sectorQuestionTrendsHistoryAnswerEntity,
    );
  }

  async getSectorQuestionAnswer(companyId: number, financialYearId: number) {
    return await this.getRepo(SectorQuestionAnswerEntity).find({ where: { companyId, financialYearId } });
  }

  async getSectorQuestionTabularAnswer(companyId: number, financialYearId: number) {
    return await this.getRepo(SectorQuestionTabularAnswerEntity).find({ where: { companyId, financialYearId } });
  }

  async getSectorQuestionTrendsAnswer(companyId: number, financialYearId: number) {
    const data = await this.getRepo(SectorQuestionTrendsAnswerEntity).find({ where: { companyId, financialYearId } });
    return data;
  }

  async getSectorQuestionTrendsAnswerBasedId(qIds: number[], financialYearId: number) {
    return await this.getRepo(SectorQuestionTrendsAnswerEntity).find({ where: { questionId: In(qIds), financialYearId }, select: ['questionId', 'dateRangeSourceId', 'sourceId', 'readingValue', 'fromDate', 'toDate'], });
  }

  async getSectorQuestionTabularAnswerBasedId(qIds: number[], financialYearId: number) {
    return await this.getRepo(SectorQuestionTabularAnswerEntity).find({ where: { questionId: In(qIds), financialYearId }, select: ['questionId', 'answer', 'sourceId'], });
  }

  async getReportingQuestionTabularAnswerBasedId(qIds: number[], financialYearId: number) {
    return await this.getRepo(ReportingQuestionAnswerEntity).find({ where: { questionId: In(qIds), financialYearId }, select: ['id', 'questionId', 'answer', 'sourceId', 'subLocationId', 'fromDate', 'toDate', 'financialYearId'], });
  }

  async getReportingQuestionAnswer(qIds: number[]) {
    return await this.getRepo(ReportingQuestionAnswerEntity).find({ where: { questionId: In(qIds) } });
  }


  async getSectorQuestionAllTrendsAnswerBasedId(qIds: number[]) {
    return await this.getRepo(SectorQuestionTrendsAnswerEntity).find({ where: { questionId: In(qIds) }, select: ['questionId', 'dateRangeSourceId', 'sourceId', 'readingValue', 'fromDate', 'toDate'], });
  }
  async getSectorQuestionAnswers(companyId: number, financialYearId: number) {
    const query = `
      SELECT
        rsa.id,
        rsa.user_id AS userId,
        rsa.financial_year_id AS financialYearId,
        rsa.framework_id AS frameworkId,
        rsa.question_id AS questionId,
        rsa.not_applicable AS notApplicable,
        rsa.topic_id AS topicId,
        rsa.kpi_id AS kpiId,
        rsa.answer,
        rsa.note AS note,
        rsa.source_id AS sourceId,
        rsa.proof_document AS proofDocument,
        rsa.remark,
        rsa.company_id AS companyId,
        rsa.question_type AS questionType,
        rsa.questionnaire_type AS questionnaireType,
        rsa.status,
        rsa.created_at AS createdAt,
        rsa.updated_at AS updatedAt,
        COALESCE(rah.remark, NULL) AS auditedRemark,
        COALESCE(rah.updated_at, NULL) AS auditedDate,
        COALESCE(ru.first_name, NULL) AS auditorFirstName,
        COALESCE(ru.last_name, NULL) AS auditorLastName,
        COALESCE(ru.email, NULL) AS auditorEmail
      FROM
        riu_sector_question_answers rsa
      LEFT JOIN
        riu_audit_history rah ON rsa.id = rah.answer_id AND rah.question_type = ('qualitative' OR 'yes_no' OR 'quantitative')
      LEFT JOIN
        riu_users ru ON rah.auditer_id = ru.id
      WHERE
        rsa.company_id = ${companyId}
        AND rsa.financial_year_id = ${financialYearId}
    `;
    try {
      return await this.dataSource.query(query);
    } catch (error) {
      console.error("Error executing SQL query:", error);
      throw error;
    }
  }
  async getSectorQuestionTabularAnswers(companyId: number, financialYearId: number) {
    const query = `
      SELECT
        rsa.id,
        rsa.user_id AS userId,
        rsa.financial_year_id AS financialYearId,
        rsa.framework_id AS frameworkId,
        rsa.question_id AS questionId,
        rsa.not_applicable AS notApplicable,
        rsa.performed AS performed,
        rsa.note AS note,
        rsa.topic_id AS topicId,
        rsa.kpi_id AS kpiId,
        rsa.answer,
        rsa.source_id AS sourceId,
        rsa.proof_document AS proofDocument,
        rsa.remark,
        rsa.company_id AS companyId,
        rsa.question_type AS questionType,
        rsa.questionnaire_type AS questionnaireType,
        rsa.status,
        rsa.created_at AS createdAt,
        rsa.updated_at AS updatedAt,
        COALESCE(rah.audit_status, NULL) AS auditStatus,
        COALESCE(rah.remark, NULL) AS auditedRemark,
        COALESCE(rah.updated_at, NULL) AS auditedDate,
        COALESCE(ru.first_name, NULL) AS auditorFirstName,
        COALESCE(ru.last_name, NULL) AS auditorLastName,
        COALESCE(ru.email, NULL) AS auditorEmail
      FROM
      riu_tabular_question_answer rsa
      LEFT JOIN
        riu_audit_history rah ON rsa.id = rah.answer_id AND rah.question_type = 'tabular_question'
      LEFT JOIN
        riu_users ru ON rah.auditer_id = ru.id
      WHERE
        rsa.company_id = ${companyId}
        AND rsa.financial_year_id = ${financialYearId}
    `;
    try {
      return await this.dataSource.query(query);
    } catch (error) {
      console.error("Error executing SQL query:", error);
      throw error;
    }
  }
  async getSectorQuestionTrendsAnswers(companyId: number, financialYearId: number) {
    const query = `
      SELECT
        rsa.id,
        rsa.user_id AS userId,
        rsa.financial_year_id AS financialYearId,
        rsa.framework_id AS frameworkId,
        rsa.question_id AS questionId,
        rsa.not_applicable AS notApplicable,
        rsa.topic_id AS topicId,
        rsa.kpi_id AS kpiId,
        rsa.answer,
        rsa.note AS note,
        rsa.source_id AS sourceId,
        rsa.proof_document AS proofDocument,
        rsa.remark,
        rsa.reading_value,
        rsa.company_id AS companyId,
        rsa.question_type AS questionType,
        rsa.questionnaire_type AS questionnaireType,
        rsa.status,
        rsa.created_at AS createdAt,
        rsa.updated_at AS updatedAt,
        COALESCE(rah.remark, NULL) AS auditedRemark,
        COALESCE(rah.updated_at, NULL) AS auditedDate,
        COALESCE(ru.first_name, NULL) AS auditorFirstName,
        COALESCE(ru.last_name, NULL) AS auditorLastName,
        COALESCE(ru.email, NULL) AS auditorEmail
      FROM
      riu_question_trends_answer rsa
      LEFT JOIN
        riu_audit_history rah ON rsa.id = rah.answer_id AND rah.question_type = 'quantitative_trends'
      LEFT JOIN
        riu_users ru ON rah.auditer_id = ru.id
      WHERE
        rsa.company_id = ${companyId}
        AND rsa.financial_year_id = ${financialYearId}
    `;
    try {
      return await this.dataSource.query(query);
    } catch (error) {
      console.error("Error executing SQL query:", error);
      throw error;
    }
  }

  async getReportGenerationSettings(frameworkIds: number[]): Promise<ReportGenerationSettingEntity[]> {
    return await (this.getRepo(ReportGenerationSettingEntity) as Repository<ReportGenerationSettingEntity>).find({
      where: {
        frameworkId: In(frameworkIds)
      }
    });
  }

  async getReportGenerationSettingsForAFinancialYearAndFrameworkID(frameworkId: number, financialYearId: number): Promise<ReportGenerationSettingEntity[]> {
    return await (this.getRepo(ReportGenerationSettingEntity) as Repository<ReportGenerationSettingEntity>).find({
      where: {
        frameworkId,
        financialYearId
      }
    });
  }

  async updateReportGenerationSettings(dtos: ReportGenerationSettingDto[]): Promise<ReportGenerationSettingEntity[]> {
    const entities = this.getRepo(ReportGenerationSettingEntity).create(dtos);
    return await (this.getRepo(ReportGenerationSettingEntity) as Repository<ReportGenerationSettingEntity>).save(entities);
  }
}

