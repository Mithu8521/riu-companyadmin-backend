import { Entity, PrimaryGeneratedColumn, CreateDateColumn, Column, UpdateDateColumn } from 'typeorm';

import { QuestionStatus, QuestionType, QuestionnaireType } from '@utils/enums/Status';
@Entity('riu_sector_question_answers_history')
export class SectorQuestionHistoryAnswerEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  financialYearId: number;

  @Column()
  frameworkId: number;

  @Column()
  topicId: number;

  @Column()
  kpiId: number;

  @Column()
  questionId: number;

  @Column()
  answer: string;

  @Column()
  notApplicable: string;

  @Column()
  sourceId: number;

  @Column("simple-array")
  proofDocument: string[];

  @Column("json")
  proofDocumentNote: string[][];

  @Column()
  remark: string;

  @Column()
  companyId: number;

  @Column({ type: 'enum', enum: QuestionType })
  questionType: QuestionType;

  @Column({ type: 'enum', enum: QuestionnaireType })
  questionnaireType: QuestionnaireType;

  @Column({ type: 'enum', enum: QuestionStatus })
  status: QuestionStatus;

  @Column()
  answeredAt: Date;

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
    notApplicable: string,
    sourceId: number,
    proofDocument: string[],
    proofDocumentNote: string[][],
    remark: string,
    companyId: number,
    questionType: QuestionType,
    questionnaireType: QuestionnaireType,
    answeredAt: Date,
    status: QuestionStatus,
  ) {
    this.userId = userId;
    this.financialYearId = financialYearId;
    this.frameworkId = frameworkId;
    this.topicId = topicId;
    this.kpiId = kpiId;
    this.questionId = questionId;
    this.answer = answer;
    this.notApplicable = notApplicable;
    this.sourceId = sourceId;
    this.proofDocument = proofDocument;
    this.proofDocumentNote = proofDocumentNote;
    this.remark = remark;
    this.companyId = companyId;
    this.questionType = questionType;
    this.questionnaireType = questionnaireType;
    this.answeredAt = answeredAt;
    this.status = status;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}
