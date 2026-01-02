import { GhgDataBaseEntity } from '@modules/setting/gwp/entities/gwp.entity';
import { Injectable } from '@nestjs/common';
import { DATABASE_NAMES } from '@utils/enums/Status';
import { DataSource } from 'typeorm';

@Injectable()
export class GwpDaoService {
  constructor(private dataSource: DataSource) { }

  private getRepo(entity: any) {
    return this.dataSource.getRepository(entity);
  }

  async getGwpValue() {
    return this.getRepo(GhgDataBaseEntity).find();
  }

  async getDataBaseValueBasedOnFinanacialYear(financialYearId:number) {
    return this.getRepo(GhgDataBaseEntity).findOne({where:{financialYearId}});
  }

  async updateGhgProtocol(
    financialYearId: number, 
    databaseId: number, 
    systemUserId: number
) {
    try {
        // Check if record exists for this financial year
        const existingRecord = await this.getRepo(GhgDataBaseEntity).findOne({
            where: { financialYearId }
        });

        if (existingRecord) {
            // Update existing record
            existingRecord.databaseId = databaseId;
            existingRecord.updatedBy = systemUserId;
            existingRecord.updatedAt = new Date();
            
            await this.getRepo(GhgDataBaseEntity).save(existingRecord);
            return { message: 'GHG Protocol updated successfully' };
        } else {
            // Create new record
            const newRecord = new GhgDataBaseEntity(
                financialYearId,
                databaseId,
                systemUserId,
            );
            
            await this.getRepo(GhgDataBaseEntity).save(newRecord);
            return { message: 'GHG Protocol created successfully' };
        }
    } catch (error) {
        console.error('Error updating GHG Protocol:', error);
        throw new Error('Failed to update GHG Protocol');
    }
}

  // async updateGwpId(financialYearId: number, gwpId: number, updatedBy: number) {
  //   const repo = this.getRepo(GwpEntity);

  //   const existing = await repo.findOne({ where: { financialYearId } });

  //   if (existing) {
  //     await repo.update({ financialYearId }, { gwpId, updatedBy });
  //     return { message: 'Record updated successfully', updated: true };
  //   } else {
  //     const newRecord = repo.create({ financialYearId, gwpId, updatedBy });
  //     await repo.save(newRecord);
  //     return { message: 'Record inserted successfully', inserted: true };
  //   }
  // }

  async updateGwpId( // Keeping the same method name for compatibility
    financialYearId: number, 
    databaseId: number, 
    systemUserId: number
) {
    try {
        // Check if record exists for this financial year
        const repo = this.getRepo(GhgDataBaseEntity);
        const existingRecord = await repo.findOne({ // Using existing repository
            where: { financialYearId }
        });

        if (existingRecord) {
            // Update existing record
            existingRecord.databaseId = databaseId;
            existingRecord.updatedBy = systemUserId;
            existingRecord.updatedAt = new Date();
            
            await repo.save(existingRecord);
            return { message: `Updated successfully` };
        } else {
            // Create new record
            const newRecord = new GhgDataBaseEntity( // Using existing entity
                financialYearId,
                databaseId,
                systemUserId,
            );
            
            await repo.save(newRecord);
            return { message: `Created successfully` };
        }
    } catch (error) {
        console.error('Error updating GHG Protocol:', error);
        throw new Error('Failed to update GHG Protocol');
    }
}

}