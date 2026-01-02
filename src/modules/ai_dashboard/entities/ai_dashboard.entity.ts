import { createHash } from 'crypto';
import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Column,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';


@Entity('riu_ai_dashboard_mapping')
export class AiDashboardEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'question_id', type: 'bigint' })
  questionId: number;

  @Column({ name: 'sub_question_id', type: 'varchar', length: 255, nullable: true })
  subQuestionId: string | null;

  @Column({ type: 'varchar', length: 255 })
  module: string;

  @Column({ type: 'varchar', length: 255 })
  category: string;

  @Column({ name: 'sub_category', type: 'varchar', length: 255, nullable: true })
  subCategory: string | null;

  @Column({ type: 'varchar', length: 500 })
  kpi: string;

  @Column({ name: 'from_date', type: 'varchar', length: 255 })
  fromDate: string;

  @Column({ name: 'to_date', type: 'varchar', length: 255 })
  toDate: string;

  @Column()
  period: string;

  @Column({ name: 'display_periods' })
  displayPeriods: string;

  @Column({ name: 'location_id', type: 'bigint' })
  locationId: number;

  @Column({ name: 'sublocation_id', type: 'bigint', nullable: true })
  sublocationId: number | null;

  @Column({ name: 'financial_year' })
  financialYear: string;

  @Column()
  value: string;

  @Column()
  unit: string;

  @Column({ type: 'tinyint' })
  status: number;

  // KEY FIX: Ensure this matches the manually generated hash from Service
  @Column({ name: 'identity_key', type: 'char', length: 64, unique: true, nullable:false })
  identityKey: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  
  @BeforeInsert()
  @BeforeUpdate()
  generateIdentityKey() {
    if (this.identityKey) return;
     if (
    this.questionId == null ||
    this.module == null ||
    this.category == null ||
    this.kpi == null ||
    this.financialYear == null ||
    this.locationId == null ||
    this.fromDate == null ||
    this.toDate == null
  ) {
    throw new Error('Cannot generate identityKey: missing required fields');
  }
    const raw = [
      this.questionId,
      this.subQuestionId ?? 'NA',
      this.module,
      this.category,
      this.subCategory ?? 'NA',
      this.kpi,
      this.financialYear,
      this.locationId,
      this.sublocationId ?? 0,
      this.fromDate,
      this.toDate,
    ].join('|');

    this.identityKey = createHash('sha256').update(raw).digest('hex');
  }
  
}