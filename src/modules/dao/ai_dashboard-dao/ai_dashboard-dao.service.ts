import { AiDashboardEntity } from '@app/modules/ai_dashboard/entities/ai_dashboard.entity';
import { PublishGraphEntity } from '@app/modules/ai_dashboard/entities/publish_graph.entity';
import { UserPromptHistoryEntity } from '@app/modules/ai_dashboard/entities/user_prompt_history.entity';
import { LocationEntity } from '@app/modules/setting/source/entities/source.entity';
import { Injectable } from '@nestjs/common';
import { DataSource, In } from 'typeorm';

@Injectable()
export class AiDashboardDaoService {
  constructor(private dataSource: DataSource) { }

  private getRepo(entity: any) {
    return this.dataSource.getRepository(entity);
  }

  async saveData(data: Partial<AiDashboardEntity>) {
    const repo = this.getRepo(AiDashboardEntity);
    const newEntity = repo.create(data);
    return await repo.save(newEntity);
  }

  async bulkUpsertData(records: Partial<AiDashboardEntity>[]) {
    if (!records.length) return;

    const repo = this.getRepo(AiDashboardEntity);
    const entities = records.map((data) => {
      const entity = repo.create(data);
      entity.generateIdentityKey();
      return entity;
    });

    const BATCH_SIZE = 500;
    return repo.manager.transaction(async (transactionalManager) => {
      const tRepo = transactionalManager.getRepository(AiDashboardEntity);

      for (let i = 0; i < entities.length; i += BATCH_SIZE) {
        const batch = entities.slice(i, i + BATCH_SIZE);
        await tRepo.upsert(batch, {
          conflictPaths: ['identityKey'],
          skipUpdateIfNoValuesChanged: true,
        });
      }
    });
  }




  async savePromptData(data: Partial<UserPromptHistoryEntity>) {
    const repo = this.getRepo(UserPromptHistoryEntity);
    const newEntity = repo.create(data);
    return await repo.save(newEntity);
  }

  async savePublishData(data: Partial<PublishGraphEntity>) {
    const repo = this.getRepo(PublishGraphEntity);
    const newEntity = repo.create(data);
    return await repo.save(newEntity);
  }

  async getPublishData(where: any = {}) {
    return await this.getRepo(PublishGraphEntity).find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async getRefreshData(where: any = {}) {
    return await this.getRepo(UserPromptHistoryEntity).findOne({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async updateOutputData(graphId: number, response: any) {
    return await this.getRepo(UserPromptHistoryEntity).update(
      { id: graphId, status: 1 },
      { response: response }
    );
  }

  async updateFeedBackData(graphId: number, feedback: string) {
    return await this.getRepo(UserPromptHistoryEntity).update(
      { id: graphId, status: 1 },
      { feedback: feedback }
    );
  }

  async deletePublishData(graphId: number) {
    return await this.getRepo(PublishGraphEntity).update(
      { id: graphId, status: 1 },
      { status: 0 }
    );
  }

async getAllDashboardDataBasedOnIds(assignedQuestions: number[]) {
  const data = await this.getRepo(AiDashboardEntity).find({
    where: {
      questionId: In(assignedQuestions),
    },
  });

  const locationDetails = await this.dataSource
    .getRepository(LocationEntity)
    .find();

  const locationMap = new Map(
    locationDetails.map(loc => [loc.id, loc.unitCode])
  );

  return data.map(item => ({
    ...item,
    location: locationMap.get(Number(item.locationId)) || null,
    value: Number(item.value) || 0,
  }));
}

  async getAllDashboardData() {
    const data = await this.getRepo(AiDashboardEntity).find();

    let locationDetails = await this.dataSource
      .getRepository(LocationEntity)
      .find();

    const locationMap = new Map(
      locationDetails.map(loc => [loc.id, loc.unitCode])
    );

    return data.map(item => ({
      ...item,
      location: locationMap.get(Number(item.locationId)) || null,
      value: Number(item.value) || 0,
    }));
  }

  async getAllSavedDashboardData() {
    const data = await this.getRepo(AiDashboardEntity).find();
    return data;
  }

  async getAllHistoryData(userId: number) {
    const historyRecords = await this
      .getRepo(UserPromptHistoryEntity)
      .find({
        where: {
          status: 1,
          userId: userId,
        },
        order: { createdAt: 'DESC' },
        take: 100,
      });
    return historyRecords;
  }

} 
