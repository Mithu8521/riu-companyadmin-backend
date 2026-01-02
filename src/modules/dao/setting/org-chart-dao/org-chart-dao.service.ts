import { OrgChartEntity } from '@modules/setting/org_chart/entities/org_chart.entity';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class OrgChartDaoService {
    constructor(private dataSource: DataSource) {}

    async createOrgChart(orgChartEntity: OrgChartEntity) {
      return await this.dataSource
        .getRepository(OrgChartEntity)
        .save(orgChartEntity);
    }
  
    async getOrgChartUserId(userId: number) {
      let orgChartDetails = await this.dataSource
        .getRepository(OrgChartEntity)
        .findOne({
          where: {
            userId,
          },
        });
      return orgChartDetails;
    }

    async updateOrgChartUserId(userId: number, orgChart: string) {
      const result = await this.dataSource
        .getRepository(OrgChartEntity)
        .update({ userId }, { orgChart });
      return result;
    }
}
