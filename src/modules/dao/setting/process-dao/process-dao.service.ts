import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ProcessEntity } from '@modules/setting/process/entities/process.entity';

@Injectable()
export class ProcessDaoService {
  constructor(private dataSource: DataSource) { }

  private getRepo(entity: any) {
    return this.dataSource.getRepository(entity);
  }

  async insertProcessData(processEntity: ProcessEntity) {
    return await this.dataSource
      .getRepository(ProcessEntity)
      .save(processEntity);
  }

  async updateProcessData(id: number, process: string) {
    const currentDate = new Date();
    const result = await this.dataSource
      .createQueryBuilder()
      .update(ProcessEntity)
      .set({ process, updatedAt: currentDate })
      .where('id = :id', { id })
      .execute();
    return result.affected;
  }

  async deleteProcessData(id: number) {
    const result = await this.dataSource
      .getRepository(ProcessEntity)
      .delete(id);
    return result.affected > 0;
  }

  async getProcessBasedOnId(created_by: number) {
    let companyDetails = await this.dataSource
      .getRepository(ProcessEntity)
      .find({
        where: {
          created_by,
        },
      });
    return companyDetails;
  }
  
  async updateDeletable(id: number) {
    return this.getRepo(ProcessEntity).update({ id }, { is_deletable: false });
  }
  async getProcess() {
    return this.getRepo(ProcessEntity).find({ where: { } });
  }
}