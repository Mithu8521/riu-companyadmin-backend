import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { RoleMasterEntity } from '@modules/setting/permission/entities/role-master.entity';
@Injectable()
export class RoleMasterDaoService {
  constructor(private dataSource: DataSource) {}

  async insertRoleData(roleMasterEntity: RoleMasterEntity) {
    return await this.dataSource
      .getRepository(RoleMasterEntity)
      .save(roleMasterEntity);
  }

  async getRoleBasedOnUserId(created_by: number) {
    let roleDetails = await this.dataSource
      .getRepository(RoleMasterEntity)
      .find({
        where: {
          created_by,
          system_created:false
        },
      });
    return roleDetails;
  }

  async getRoleBasedOnRoleId(id: number) {
    let roleDetails = await this.dataSource
      .getRepository(RoleMasterEntity)
      .findOne({
        where: {
          id,
        },
      });
    return roleDetails;
  }

  async updateRoleMasterData(id: number, role_name: string) {
    const currentDate = new Date();  
    const result = await this.dataSource
      .createQueryBuilder()
      .update(RoleMasterEntity)
      .set({ role_name, updatedAt: currentDate })
      .where('id = :id', { id })
      .execute();  
    return result.affected; 
  }
  

  async deleteRoleMasterData(id: number) {
    const result = await this.dataSource
      .getRepository(RoleMasterEntity)  
      .delete(id);    
    return result.affected > 0; 
  }

  async getRoleBasedOnId(id: number) {
    let roleDetails = await this.dataSource
      .getRepository(RoleMasterEntity)
      .find({
        where: {
          id,
        },
      });
    return roleDetails;
  }
  async getRoleBasedOnUserIdAndSysterCreted(created_by: number,system_created:boolean) {
    let roleDetails = await this.dataSource
      .getRepository(RoleMasterEntity)
      .findOne({
        where: {
          created_by,
          system_created
        },
      });
    return roleDetails;
  }

  async getRoleBasedOnRoleName(role_name: string) {
    let roleDetails = await this.dataSource
      .getRepository(RoleMasterEntity)
      .find({
        where: {
          role_name,
        },
      });
    return roleDetails;
  }
  async inserCompanyData(roleMasterEntity: RoleMasterEntity) {
    return await this.dataSource
      .getRepository(RoleMasterEntity)
      .save(roleMasterEntity);
  }
  async updateOnlyAuditor(id: number, onlyauditor: boolean) {
    const result = await this.dataSource
      .getRepository(RoleMasterEntity)
      .update({ id }, { onlyauditor });
    return result;
  }
  async updateUsers(id: number, assigned_to: string) {
    const result = await this.dataSource
      .getRepository(RoleMasterEntity)
      .update({ id }, { assigned_to });
    return result;
  }
  
}
