import { Injectable } from '@nestjs/common';
import { DataSource, In, Like } from 'typeorm';
import { AuditListingEntity } from '@modules/audit/entities/audit_listing.entity';
import { AuditHistoryEntity } from '@modules/audit/entities/audit_history.entity';
import { Json } from 'aws-sdk/clients/robomaker';

@Injectable()
export class AuditListingDaoService {
  constructor(private dataSource: DataSource) { }

  private getRepo(entity: any) {
    return this.dataSource.getRepository(entity);
  }

  async insertAuditData(auditListingEntity: AuditListingEntity) {
    return this.getRepo(AuditListingEntity).save(auditListingEntity);
  }

  // async getAuditQuestionIdsAndAuditIds(userId: number, financialYearId: number) {
  //   const assignedDetails = await this.getRepo(AuditListingEntity).find({
  //     where: [
  //       { viewAuditUser: Like(`%,${userId},%`), financialYearId: financialYearId },
  //       { viewAuditUser: Like(`${userId},%`), financialYearId: financialYearId },
  //       { viewAuditUser: Like(`%,${userId}`), financialYearId: financialYearId },
  //       { viewAuditUser: userId.toString(), financialYearId: financialYearId }
  //     ],
  //   });
  //   return assignedDetails;
  // }

  async getAuditQuestionIdsAndAuditIds(userIds: number[], financialYearId: number) {
    if (!Array.isArray(userIds) || userIds.length === 0) return [];

    const whereConditions = userIds.flatMap(userId => ([
      { viewAuditUser: Like(`%,${userId},%`), financialYearId },
      { viewAuditUser: Like(`${userId},%`), financialYearId },
      { viewAuditUser: Like(`%,${userId}`), financialYearId },
      { viewAuditUser: `${userId}`, financialYearId },
    ]));

    const assignedDetails = await this.getRepo(AuditListingEntity).find({
      where: whereConditions,
    });

    return assignedDetails;
  }


  async getAuditHistoryQuestionIds(financialYearId: number) {
    const assignedDetails = await this.getRepo(AuditListingEntity).find({
      where: [
        { financialYearId: financialYearId },
      ],
    });
    return assignedDetails;
  }

  async getAuditHistoryForQuestionId(questionId: number, financialYearId: number) {
    return await this.getRepo(AuditListingEntity).find({
      where: {
        questionId,
        financialYearId
      }
    });
  }

  async getAuditHistoryQuestionIdsAndAuditIds(userId: number) {
    const assignedDetails = await this.getRepo(AuditHistoryEntity).find({
      where: [
        { viewAuditHistory: Like(`%,${userId},%`) },
        { viewAuditHistory: Like(`${userId},%`) },
        { viewAuditHistory: Like(`%,${userId}`) },
        { viewAuditHistory: userId.toString() }
      ],
      select: ['questionId', 'auditerId', 'remark'],
    });
    return assignedDetails;
  }


  async updateAuditorToAnswer(questionId: number, auditerId: number, viewAuditUser: number[]) {
    return this.getRepo(AuditListingEntity).update({ questionId }, { auditerId, viewAuditUser });
  }

  async updateAuditor(questionId: number, answerId: number, viewAuditUser: any, remark: Json, auditerId: number) {
    return this.getRepo(AuditListingEntity).update({ questionId, answerId }, { auditerId, viewAuditUser, remark });
  }

  async getExistingRecordAuditor(questionId: number) {
    return this.getRepo(AuditListingEntity).findOne({ where: { questionId } });
  }

  async getExistingRecordAuditors(questionId: number, auditerId: number, answerId: number) {
    return this.getRepo(AuditListingEntity).findOne({ where: { questionId, auditerId, answerId } });
  }

  async getExistingAllRecordAuditors(auditerId: number, financialYearId: number) {
    return this.getRepo(AuditListingEntity).find({ where: { auditerId, financialYearId } });
  }

  async getExistingAllLOcationRecordAuditors(answeId: number[], financialYearId: number) {
    return this.getRepo(AuditListingEntity).find({ where: { answerId: In(answeId), financialYearId } });
  }

  async updateAuditorId(answerId: number, auditerId: number) {
    return this.getRepo(AuditListingEntity).update({ answerId }, { auditerId });
  }

  async deleteAuditData(questionId: number, auditerId: number, answerId: number) {
    const result = this.getRepo(AuditListingEntity).delete({ questionId, auditerId, answerId });
    return result;
  }

  async getAuditorListByReportingQuestionAnswerId(answerId:number){
    return this.getRepo(AuditListingEntity).findOne({where:{answerId}})
  }
}
