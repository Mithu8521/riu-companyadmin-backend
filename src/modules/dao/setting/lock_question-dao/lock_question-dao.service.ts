import { PeriodLockEntity } from '@modules/setting/lock_question/entities/lock_question.entity';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class LockQuestionDaoService {
  constructor(private dataSource: DataSource) {}

  private getRepo(entity: any) {
    return this.dataSource.getRepository(entity);
  }

async lockPeriod(
  companyId: number,
  financialYearId: number,
  lockedBy: number,
  key:string,
  reason?: string,
  fromDate?: string,
  toDate?: string,
  allowedUsers?: number[]
) {
  try {
    const repo = this.getRepo(PeriodLockEntity);

    // Check if record already exists
    const existingRecord = await repo.findOne({
      where: { companyId, financialYearId, fromDate, toDate },
    });

    if (existingRecord) {
      // ✅ Update only (same row, no new row)
      await repo.update(existingRecord.id, {
        isLocked: true,
        lockedBy,
        lockedAt: new Date(),
        reason: reason || "Manual lock",
        allowedUsers: allowedUsers || [],
        updatedAt: new Date(),
      });

      return { message: `Period ${key} successfully`, updated: true };
    } else {
      // ✅ Create only if record not exists
      await repo.insert({
        companyId,
        financialYearId,
        fromDate,
        toDate,
        isLocked: true,
        lockedBy,
        lockedAt: new Date(),
        reason: reason || "Manual lock",
        allowedUsers: allowedUsers || [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return { message: "Period locked successfully", created: true };
    }
  } catch (error) {
    console.error("Error locking period:", error);
    throw new Error("Failed to lock period");
  }
}



  async unlockPeriod(
    companyId: number,
    financialYearId: number,
    periodValue: number,
    frequency: string,
    unlockedBy: number,
    unlockReason?: string
  ) {
    try {
      const repo = this.getRepo(PeriodLockEntity);
      
      const existingRecord = await repo.findOne({
        where: {
          companyId,
          financialYearId,
          periodValue,
          frequency
        }
      });

      if (!existingRecord) {
        return { message: 'Period lock record not found', notFound: true };
      }

      if (!existingRecord.isLocked) {
        return { message: 'Period is already unlocked', alreadyUnlocked: true };
      }

      // Update record to unlocked
      existingRecord.isLocked = false;
      existingRecord.unlockedBy = unlockedBy;
      existingRecord.unlockedAt = new Date();
      existingRecord.unlockReason = unlockReason || 'Manual unlock';
      existingRecord.updatedAt = new Date();
      
      await repo.save(existingRecord);
      return { message: 'Period unlocked successfully', updated: true };
    } catch (error) {
      console.error('Error unlocking period:', error);
      throw new Error('Failed to unlock period');
    }
  }

  async findLockByPeriod(
    companyId: number,
    financialYearId: number,
    periodValue: number,
    frequency: string
  ) {
    return this.getRepo(PeriodLockEntity).findOne({
      where: {
        companyId,
        financialYearId,
        periodValue,
        frequency
      }
    });
  }

  async getLockedPeriods(financialYearId: number) {
    return this.getRepo(PeriodLockEntity).find({
      where: {
        financialYearId,
      },
          
    });
  }

  async getAllPeriodsForFinancialYear(companyId: number, financialYearId: number) {
    return this.getRepo(PeriodLockEntity).find({
      where: {
        companyId,
        financialYearId
      },
      order: {
        frequency: 'ASC',
        periodValue: 'ASC'
      }
    });
  }

  async getPeriodLockStatus(companyId: number, financialYearId: number) {
    return this.getRepo(PeriodLockEntity).findOne({
      where: {
        companyId,
        financialYearId,
      }
    });
  }



}