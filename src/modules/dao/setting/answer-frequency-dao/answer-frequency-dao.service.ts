
import { AnswerFrequencyEntity } from '@modules/setting/frequency/entities/frequency.entity';
import { Injectable } from '@nestjs/common';
import { AnswerFrequency } from '@utils/enums/Status';
import { DataSource } from 'typeorm';

@Injectable()
export class AnswerFrequencyDaoService {
  constructor(private dataSource: DataSource) { }

  private getRepo(entity: any) {
    return this.dataSource.getRepository(entity);
  }

  async getAnswerFrequency(financialYearId:number) {
    return this.getRepo(AnswerFrequencyEntity).find({ where: {financialYearId} });
  }

  async updateFreaquencyStatus(financialYearId: number, frequency: AnswerFrequency) {
    return this.getRepo(AnswerFrequencyEntity).update({ financialYearId }, { frequency });
}

  async updateFrequencyData(financialYearId: number, moduleId: number, frequency: AnswerFrequency) {
    const currentDate = new Date();
    const updateResult = await this.dataSource
      .createQueryBuilder()
      .update(AnswerFrequencyEntity)
      .set({ frequency, updatedAt: currentDate })
      .where('moduleId = :moduleId AND financialYearId = :financialYearId', { financialYearId, moduleId })
      .execute();

    if (updateResult.affected === 0) {
      const newProcess = this.dataSource.getRepository(AnswerFrequencyEntity).create({
        financialYearId,
        moduleId,
        frequency,
        isEditable: true,
      });

      await this.dataSource.getRepository(AnswerFrequencyEntity).save(newProcess);
    }
    return updateResult.affected;
}


}