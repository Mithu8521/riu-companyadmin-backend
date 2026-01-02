import { QuestionStatus, QuestionType, QuestionnaireType } from '@utils/enums/Status';
import { Json } from 'aws-sdk/clients/robomaker';
import { Entity, PrimaryGeneratedColumn, CreateDateColumn, Column, UpdateDateColumn } from 'typeorm';

  
  @Entity('riu_audit_listing')
  export class AuditListingEntity {
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

    @Column({ type: 'enum', enum: QuestionnaireType })
    questionnaireType: QuestionnaireType;
  
    @Column()
    answerId: number;
  
    @Column()
    auditerId: number;

    @Column('simple-array', { nullable: true })
    viewAuditUser: number[];

    @Column('simple-json', { nullable: true })
    remark: { userId: number, remark: string }[];

    @Column({ type: 'enum', enum: QuestionStatus })
    auditStatus: QuestionStatus;
  
    @CreateDateColumn()
    createdAt: Date;
  
    @UpdateDateColumn()
    updatedAt: Date;
  
    constructor(
      questionType: QuestionType,
      companyId: number,
      financialYearId: number,
      questionId: number,
      questionnaireType: QuestionnaireType,
      answerId: number,
      auditerId: number,
      viewAuditUser: number[] | string,
      auditStatus: QuestionStatus   
    ) {
      this.questionType = questionType;
      this.companyId = companyId;
      this.financialYearId = financialYearId;
      this.questionId = questionId;
      this.questionnaireType = questionnaireType;
      this.answerId = answerId;
      this.auditerId = auditerId;
      this.viewAuditUser = Array.isArray(viewAuditUser) ? viewAuditUser : [parseInt(viewAuditUser, 10)];
      this.auditStatus = auditStatus;
      this.createdAt = new Date();
      this.updatedAt = new Date();
    }
  }
  