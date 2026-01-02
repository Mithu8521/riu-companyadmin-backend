import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DesignationEntity } from '@modules/setting/designation/entities/designation.entity';

@Injectable()
export class DesignationDaoService {
  constructor(private dataSource: DataSource) {}

  async insertDesignationData(designationEntity: DesignationEntity) {
    return await this.dataSource
      .getRepository(DesignationEntity)
      .save(designationEntity);
  }

  async updateDesignationData(id: number, designation: string) {
    const currentDate = new Date();  
    const result = await this.dataSource
      .createQueryBuilder()
      .update(DesignationEntity)
      .set({ designation, updatedAt: currentDate })
      .where('id = :id', { id })
      .execute();  
    return result.affected; 
  }
  

  async deleteDesignationData(id: number) {
    const result = await this.dataSource
      .getRepository(DesignationEntity)  
      .delete(id);    
    return result.affected > 0; 
  }

  async getDesignationBasedOnUserId(created_by: number) {
    let companyDetails = await this.dataSource
      .getRepository(DesignationEntity)
      .find({
        where: {
          created_by,
        },
      });
    return companyDetails;
  }
  async getDesignationBasedOnId(id: number) {
    let designationDetails = await this.dataSource
      .getRepository(DesignationEntity)
      .findOne({
        where: {
          id,
        },
      });
    return designationDetails;
  }

}