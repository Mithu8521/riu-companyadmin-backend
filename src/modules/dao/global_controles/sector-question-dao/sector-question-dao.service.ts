import { SectorQuestionEntity } from '@modules/global_controles/sector_question/entities/sector_question.entity';
import { SectorQuestionDetailsEntity } from '@modules/global_controles/sector_question/entities/sector_question_details.entity';
import { Injectable } from '@nestjs/common';
import { DataSource, In, IsNull } from 'typeorm';

@Injectable()
export class SectorQuestionDaoService {
  constructor(private dataSource: DataSource) { }

  async createSectorQuestion(sectorQuestionEntity: SectorQuestionEntity) {
    return await this.dataSource
      .getRepository(SectorQuestionEntity)
      .save(sectorQuestionEntity);
  }

  async createSectorQuestionDetails(sectorQuestionDetailsEntities: SectorQuestionDetailsEntity[]) {
    return await this.dataSource
      .getRepository(SectorQuestionDetailsEntity)
      .save(sectorQuestionDetailsEntities);
  }

  async getAllSectorQuestionDetails() {
    let topicDetails = await this.dataSource
      .getRepository(SectorQuestionDetailsEntity)
      .find({});
    return topicDetails;
  }


  async getTopicBasedFrameworkId(frameworkId: number) {
    let topicDetails = await this.dataSource
      .getRepository(SectorQuestionEntity)
      .find({
        where: {
          frameworkId,
        },
      });
    return topicDetails;
  }

  async updateTopic(id: number, updatedBy: number, topicTitle: string) {
    const result = await this.dataSource
      .getRepository(SectorQuestionEntity)
    // .update({ id }, { topicTitle, updatedBy });
    return result;
  }

  async getSectorQuestionBasedOnKpi(kpiId: number) {
    const result = await this.dataSource
      .getRepository(SectorQuestionEntity)
      .find({
        where: {
          kpiId: kpiId,
        },
      });
    return result;
  }

  async getSectorQuestionBasedOnTopic(topicId: number) {
    const result = await this.dataSource
      .getRepository(SectorQuestionEntity)
      .find({
        where: {
          topicId: topicId,
          kpiId: IsNull(),
        },
      });
    return result;
  }

  async getSectorQuestionBasedOnFramework(frameworkId: number) {
    const result = await this.dataSource
      .getRepository(SectorQuestionEntity)
      .find({
        where: {
          frameworkId: frameworkId,
          topicId: IsNull(),
          kpiId: IsNull(),
        },
      });
    return result;
  }


  async deleteQuestionData(id: number) {
    const result = await this.dataSource
      .getRepository(SectorQuestionEntity)
      .delete(id);
    return result.affected > 0;
  }

  async getSectorQuestionDetails(questionId: number) {
    let topicDetails = await this.dataSource
      .getRepository(SectorQuestionDetailsEntity)
      .find({
        where: {
          questionId,
        },
      });
    return topicDetails;
  }
}
