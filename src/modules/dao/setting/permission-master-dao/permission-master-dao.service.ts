import { PermissionMasterEntity } from '@modules/setting/permission/entities/permission.entity';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class PermissionMasterDaoService {
    constructor(private dataSource: DataSource) {}

    async insertPermissionData(permissionMasterEntity: PermissionMasterEntity) {
      return await this.dataSource
        .getRepository(PermissionMasterEntity)
        .save(permissionMasterEntity);
    }

    async getPermissionBasedOnRoleId(role_id: number) {
      let permissionDetails = await this.dataSource
        .getRepository(PermissionMasterEntity)
        .find({
          where: {
            role_id,
          },
        });
      return permissionDetails;
    }

    async getPermissionBasedOnRoleIdAndSequenceId(role_id: number,sequence_id: number,created_by:number) {
      let permissionDetails = await this.dataSource
        .getRepository(PermissionMasterEntity)
        .find({
          where: {
            role_id,
            sequence_id,
            created_by
          },
        });
      return permissionDetails;
    }

    async updatePermission(created_by: number, sequence_id: number, role_id: number, newPermission: string) {
      const result = await this.dataSource
        .getRepository(PermissionMasterEntity)
        .update({created_by, sequence_id, role_id }, { permission: newPermission });
      return result;
    }
    async updateBulkPermissions(
      updates: {
        created_by: number;
        sequence_id: number;
        role_id: number;
        newPermission: string;
      }[],
    ): Promise<void> {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
    
      try {
        for (const item of updates) {
          await queryRunner.manager.update(
            PermissionMasterEntity,
            {
              created_by: item.created_by,
              sequence_id: item.sequence_id,
              role_id: item.role_id,
            },
            { permission: item.newPermission },
          );
        }
    
        await queryRunner.commitTransaction();
      } catch (err) {
        await queryRunner.rollbackTransaction();
        throw err;
      } finally {
        await queryRunner.release();
      }
    }
    
    
    
   
}
