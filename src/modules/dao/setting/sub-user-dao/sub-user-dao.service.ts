import { SubUserEntity } from '@modules/setting/sub-user/entities/sub-user.entity';
import { Injectable } from '@nestjs/common';
import { DataSource, In } from 'typeorm';

@Injectable()
export class SubUserDaoService {
    constructor(private dataSource: DataSource) {}
    async inserSubUserData(subUserEntity: SubUserEntity) {
        return await this.dataSource
          .getRepository(SubUserEntity)
          .save(subUserEntity);
      }
      

      async getAllSubUser(id: number[]) {
        let subUserDetails = await this.dataSource
          .getRepository(SubUserEntity)
          .find({
            where: {
                id: In(id),
            },
          });
        return subUserDetails;
      }

      async getSubUserBasedOnUserId(invitedBy: number) {
        let subUserDetails = await this.dataSource
          .getRepository(SubUserEntity)
          .find({
            where: {
                invitedBy,
                status:true
            },
          });
        return subUserDetails;
      }

      async getSubUserBasedOnDesignationIds(designationIds: number[]) {
        let subUserDetails = await this.dataSource
          .getRepository(SubUserEntity)
          .find({
            where: {
              designationId: In(designationIds), 
              status:true
            },
          });
        return subUserDetails;
      }
      
      async getSubUserBasedOnDesignationId(designationId: number) {
        let subUserDetails = await this.dataSource
          .getRepository(SubUserEntity)
          .find({
            where: {
                designationId ,
            },
          });
        return subUserDetails;
      }


      async getSubUserBasedOnCompanyId(companyId: number) {
        let subUserDetails = await this.dataSource
          .getRepository(SubUserEntity)
          .findOne({
            where: {
              companyId ,
            },
          });
        return subUserDetails;
      }



        async updateTwoFactor(companyId: number, twoFaStatus: boolean) {
          const result = await this.dataSource
            .getRepository(SubUserEntity)
            .update({ companyId }, { twoFaStatus });
          return result;
        }
  

      async getSubUserBasedOnId(companyId: number) {
        let subUserDetails = await this.dataSource
          .getRepository(SubUserEntity)
          .findOne({
            where: {
              companyId ,
            },
          });
        return subUserDetails;
      }      

      async getSubUserBasedOnRoleId(roleId: number) {
        let subUserDetails = await this.dataSource
          .getRepository(SubUserEntity)
          .find({
            where: {
              roleId ,
              status: true
            },
          });
        return subUserDetails;
      }

      async getSubUserBasedOnRoleIds(roleIds: number[]) {
        let subUserDetails = await this.dataSource
            .getRepository(SubUserEntity)
            .find({
                where: {
                    roleId: In(roleIds),
                    status: true
                },
            });
        return subUserDetails;
    }

      async updateParentId(companyId: number, parentId: number ) {
        const result = await this.dataSource
          .getRepository(SubUserEntity)
          .update({ companyId }, { parentId, createdAt: new Date() });
        return result;
      }

      async updateSourceId(companyId: number, sourceId: string ) {
        const result = await this.dataSource
          .getRepository(SubUserEntity)
          .update({ companyId }, { sourceId });
        return result;
      }
      async updateSourceIdBasedId(companyId: number, sourceId: string ) {
        const result = await this.dataSource
          .getRepository(SubUserEntity)
          .update({ companyId }, { sourceId });
        return result;
      }

      async updateStatus(companyId: number, status: boolean) {
        return await this.dataSource
          .getRepository(SubUserEntity)
          .update({companyId}, {  status });
      }
      
      
}
