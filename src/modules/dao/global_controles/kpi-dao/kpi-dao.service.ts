import { KpiEntity } from '@modules/global_controles/kpi/entities/kpi.entity';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class KpiDaoService {
    constructor(private dataSource: DataSource) {}

    async createKpi(kpiEntity: KpiEntity) {
      return await this.dataSource
        .getRepository(KpiEntity)
        .save(kpiEntity);
    }
  
    async getKpiBasedTopicId(topicId: number) {
      let kpiDetails = await this.dataSource
        .getRepository(KpiEntity)
        .find({
          where: {
            topicId,
          },
        });
      return kpiDetails;
    }

    async getKpiBasedId(id: number) {
      let kpiDetails = await this.dataSource
        .getRepository(KpiEntity)
        .find({
          where: {
            id,
          },
        });
      return kpiDetails;
    }

    async updateKpi(id: number, updatedBy: number, kpiTitle: string) {
      const result = await this.dataSource
        .getRepository(KpiEntity)
        .update({ id }, { kpiTitle, updatedBy });
      return result;
    }
    
    async updateKpiWhenQuestionCreate(id: number, questionCreated: boolean,isDeletable:boolean) {
      const result = await this.dataSource
        .getRepository(KpiEntity)
        .update({ id }, { questionCreated ,isDeletable });
      return result;
    }
    async deleteKpiData(id: number) {
      const result = await this.dataSource
        .getRepository(KpiEntity)  
        .delete(id);    
      return result.affected > 0; 
    }
}
