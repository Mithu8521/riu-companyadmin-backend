import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('period_locks')
export class PeriodLockEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'company_id', type: 'int' })
  companyId: number;

  @Column({ name: 'financial_year_id', type: 'int' })
  financialYearId: number;

  @Column({ name: 'from_date', type: 'varchar', length: 7, nullable: true }) // YYYY-MM format
  fromDate: string;

  @Column({ name: 'to_date', type: 'varchar', length: 7, nullable: true }) // YYYY-MM format
  toDate: string;

  @Column({ name: 'allowed_users', type: 'json', nullable: true })
  allowedUsers: number[];

  @Column({ name: 'is_locked', type: 'boolean', default: false })
  isLocked: boolean;

  @Column({ name: 'locked_by', type: 'int', nullable: true })
  lockedBy: number;

  @Column({ name: 'locked_at', type: 'timestamp', nullable: true })
  lockedAt: Date;

  @Column({ name: 'unlocked_by', type: 'int', nullable: true })
  unlockedBy: number;

  @Column({ name: 'unlocked_at', type: 'timestamp', nullable: true })
  unlockedAt: Date;

  @Column({ name: 'reason', type: 'text', nullable: true })
  reason: string;

  @Column({ name: 'unlock_reason', type: 'text', nullable: true })
  unlockReason: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  constructor(
    companyId?: number,
    financialYearId?: number,
    fromDate?: string,
    toDate?: string,
    isLocked?: boolean,
    lockedBy?: number,
    reason?: string,
    allowedUsers?: number[]
  ) {
    if (companyId !== undefined) {
      this.companyId = companyId;
    }
    if (financialYearId !== undefined) {
      this.financialYearId = financialYearId;
    }
    if (fromDate !== undefined) {
      this.fromDate = fromDate;
    }
    if (toDate !== undefined) {
      this.toDate = toDate;
    }
    if (isLocked !== undefined) {
      this.isLocked = isLocked;
    }
    if (lockedBy !== undefined) {
      this.lockedBy = lockedBy;
      this.lockedAt = new Date();
    }
    if (reason !== undefined) {
      this.reason = reason;
    }
    if (allowedUsers !== undefined) {
      this.allowedUsers = allowedUsers;
    }
  }
}