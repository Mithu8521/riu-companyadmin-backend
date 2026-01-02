import { QuestionStatus, QuestionType, QuestionnaireType } from '@utils/enums/Status';
import { Entity, PrimaryGeneratedColumn, CreateDateColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('riu_audit_history')
export class AuditHistoryEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: QuestionType })
  questionType: QuestionType;

  @Column()
  companyId: number;

  @Column()
  financialYearId: number;

  @Column()
  questionId: number;

  @Column()
  remark: string;

  @Column({ type: 'enum', enum: QuestionnaireType })
  questionnaireType: QuestionnaireType;

  @Column()
  answerId: number;

  @Column()
  auditerId: number;

  @Column('simple-array', { nullable: true })
  viewAuditHistory: number[];

  @Column({ type: 'enum', enum: QuestionStatus })
  auditStatus: QuestionStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  constructor(
    remark: string,
    questionType: QuestionType,
    companyId: number,
    financialYearId: number,
    questionId: number,
    questionnaireType: QuestionnaireType,
    answerId: number,
    auditerId: number,
    viewAuditHistory: number[] | string,
    auditStatus: QuestionStatus,
  ) {
    this.remark = remark;
    this.questionType = questionType;
    this.companyId = companyId;
    this.financialYearId = financialYearId;
    this.questionId = questionId;
    this.questionnaireType = questionnaireType;
    this.answerId = answerId;
    this.auditerId = auditerId;
    this.viewAuditHistory = Array.isArray(viewAuditHistory) ? viewAuditHistory : [parseInt(viewAuditHistory, 10)];
    this.auditStatus = auditStatus;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}
