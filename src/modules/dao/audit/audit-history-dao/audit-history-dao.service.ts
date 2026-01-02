import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AuditHistoryEntity } from '@modules/audit/entities/audit_history.entity';

@Injectable()
export class AuditHistoryDaoService {
  constructor(private dataSource: DataSource) {}

  private getRepo(entity: any) {
    return this.dataSource.getRepository(entity);
  }

  async insertAuditHistoryData(auditHistoryEntity: AuditHistoryEntity) {
    return this.getRepo(AuditHistoryEntity).save(auditHistoryEntity);
  }
}
