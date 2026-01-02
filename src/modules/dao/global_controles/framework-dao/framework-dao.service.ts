import { FrameworkEntity } from '@modules/global_controles/framework/entities/framework.entity';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class FrameworkDaoService {
  constructor(private dataSource: DataSource) {}

  async createFramework(frameworkEntity: FrameworkEntity) {
    return await this.dataSource
      .getRepository(FrameworkEntity)
      .save(frameworkEntity);
  }

  async getFrameworkBasedCompanyId(companyId: number) {
    let designationDetails = await this.dataSource
      .getRepository(FrameworkEntity)
      .find({
        where: {
            companyId,
        },
      });
    return designationDetails;
  }
  async getFrameworkBaseId(id: number) {
    let frameworkDetails = await this.dataSource
      .getRepository(FrameworkEntity)
      .find({
        where: {
          id,
        },
      });
    return frameworkDetails;
  }
  async updateFramework(id: number, updatedBy: number, frameworkTitle: string) {
    const result = await this.dataSource
      .getRepository(FrameworkEntity)
      .update({ id }, { frameworkTitle, updatedBy });
    return result;
  }

  async updateFrameworkWhenQuestionCreate(id: number, questionCreated: boolean) {
    const result = await this.dataSource
      .getRepository(FrameworkEntity)
      .update({ id }, { questionCreated });
    return result;
  }


  async updateFrameworkWhenTopicCreate(id: number, topicCreated: boolean, isDeletable: boolean) {  
      const result = await this.dataSource
        .getRepository(FrameworkEntity)
        .update({ id }, { topicCreated, isDeletable });
      return result;  
  }  
  
  async deleteFrameworkData(id: number) {
    const result = await this.dataSource
      .getRepository(FrameworkEntity)  
      .delete(id);    
    return result.affected > 0; 
  }
}
