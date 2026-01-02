import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { EsgReportingEntity } from '@modules/esg_reporting/entities/esg_reporting.entity';

@Injectable()
export class EsgReportingDaoService {
  constructor(private dataSource: DataSource) {}

  async insertEsgReportingData(esgReportingEntity: EsgReportingEntity) {
    return await this.dataSource
      .getRepository(EsgReportingEntity)
      .save(esgReportingEntity);
  }
  
  async getEsgReportingBasedOnCompanyId(companyId: number) {
    let esgReportingDetails = await this.dataSource
      .getRepository(EsgReportingEntity)
      .findOne({
        where: {
            companyId,
        },
      });
    return esgReportingDetails;
  }
  async getEsgReportingBasedOnUserId(createdBy: number) {
    let esgReportingDetails = await this.dataSource
      .getRepository(EsgReportingEntity)
      .find({
        where: {
          createdBy,
        },
      });
    return esgReportingDetails;
  }
  async updateEsgReporting(financialYearId: number, frameworkTopicKpi: string) {
    const result = await this.dataSource
      .getRepository(EsgReportingEntity)
      .update({ financialYearId }, { frameworkTopicKpi });
    return result;
  }
}
