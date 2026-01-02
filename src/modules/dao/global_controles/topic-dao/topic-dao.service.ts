import { TopicEntity } from '@modules/global_controles/topic/entities/topic.entity';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class TopicDaoService {
    constructor(private dataSource: DataSource) {}

    async createTopic(topicEntity: TopicEntity) {
      return await this.dataSource
        .getRepository(TopicEntity)
        .save(topicEntity);
    }
  
    async getTopicBasedFrameworkId(frameworkId: number) {
      let topicDetails = await this.dataSource
        .getRepository(TopicEntity)
        .find({
          where: {
            frameworkId,
          },
        });
      return topicDetails;
    }
    async getTopicBasedId(id: number) {
      let topicDetails = await this.dataSource
        .getRepository(TopicEntity)
        .find({
          where: {
            id,
          },
        });
      return topicDetails;
    }
    async updateTopic(id: number, updatedBy: number, topicTitle: string) {
      const result = await this.dataSource
        .getRepository(TopicEntity)
        .update({ id }, { topicTitle, updatedBy });
      return result;
    }

    async updateTopicWhenQuestionCreate(id: number, questionCreated: boolean) {
      const result = await this.dataSource
        .getRepository(TopicEntity)
        .update({ id }, { questionCreated });
      return result;
    }
    
    async updateTopicWhenKpiCreate(id: number, kpiCreated: boolean, isDeletable: boolean) {  
      const result = await this.dataSource
        .getRepository(TopicEntity)
        .update({ id }, { kpiCreated, isDeletable });
      return result;  
  }
  
  async deleteTopicData(id: number) {
    const result = await this.dataSource
      .getRepository(TopicEntity)  
      .delete(id);    
    return result.affected > 0; 
  }
}
