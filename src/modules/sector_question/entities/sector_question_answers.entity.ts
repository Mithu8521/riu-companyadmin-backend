import { QuestionStatus, QuestionType, QuestionnaireType } from '@utils/enums/Status';
import { Entity, PrimaryGeneratedColumn, CreateDateColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('riu_sector_question_answers')
export class SectorQuestionAnswerEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  financialYearId: number;

  @Column()
  frameworkId: number;

  @Column({ nullable: true })
  topicId: number;

  @Column({ nullable: true })
  kpiId: number;

  @Column()
  questionId: number;

  @Column()
  answer: string;

  @Column({ nullable: true })
  note: string;

  @Column({ nullable: true })
  notApplicable: string;

  @Column()
  sourceId: number;

  @Column({ type: 'json', nullable: true }) 
  proofDocument: any;

  @Column({ nullable: true })
  proofDocumentNote: string;

  @Column({ nullable: true })
  remark: string;

  @Column()
  companyId: number;

  @Column({ type: 'enum', enum: QuestionType })
  questionType: QuestionType;

  @Column({ type: 'enum', enum: QuestionnaireType })
  questionnaireType: QuestionnaireType;

  @Column({ type: 'enum', enum: QuestionStatus, nullable: true })
  status: QuestionStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  constructor(
    userId: number,
    financialYearId: number,
    frameworkId: number,
    topicId: number,
    kpiId: number,
    questionId: number,
    answer: string,
    note: string,
    notApplicable: string,
    sourceId: number,
    proofDocument: any,
    proofDocumentNote: string,
    remark: string,
    companyId: number,
    questionType: QuestionType,
    questionnaireType: QuestionnaireType,
    status: QuestionStatus
  ) {
    this.userId = userId;
    this.financialYearId = financialYearId;
    this.frameworkId = frameworkId;
    this.topicId = topicId;
    this.kpiId = kpiId;
    this.questionId = questionId;
    this.answer = answer;
    this.note = note;
    this.notApplicable = notApplicable;
    this.sourceId = sourceId;
    this.proofDocument = proofDocument;
    this.proofDocumentNote = proofDocumentNote;
    this.remark = remark;
    this.companyId = companyId;
    this.questionType = questionType;
    this.questionnaireType = questionnaireType;
    this.status = status;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}
