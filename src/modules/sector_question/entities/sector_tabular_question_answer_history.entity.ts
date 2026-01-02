import { QuestionStatus, QuestionType, QuestionnaireType } from '@utils/enums/Status';
import { Entity, PrimaryGeneratedColumn, CreateDateColumn, Column, UpdateDateColumn } from 'typeorm';
@Entity('riu_tabular_question_answer_history')
export class SectorQuestionTabularHistoryAnswerEntity {
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
  sourceId: number;

  @Column({ type: 'enum', enum: QuestionType })
  questionType: QuestionType;

  @Column()
  answer: string;

  @Column()
  notApplicable: string;

  @Column()
  performed: boolean;  

  @Column("simple-array")
  proofDocument: string[];

  @Column("json")
  proofDocumentNote: string[][];

  @Column()
  remark: string;

  @Column()
  companyId: number;

  @Column({ type: 'enum', enum: QuestionnaireType })
  questionnaireType: QuestionnaireType;

  @Column()
  answeredAt: Date;

  @Column({ type: 'enum', enum: QuestionStatus })
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
    sourceId: number,
    questionType: QuestionType,
    answer: string,
    notApplicable: string,
    performed: boolean,
    proofDocument: string[],
    proofDocumentNote: string[][],
    remark: string,
    companyId: number,
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
    this.sourceId = sourceId;
    this.questionType = questionType;
    this.answer = answer;
    this.notApplicable = notApplicable;
    this.performed = performed;
    this.proofDocument = proofDocument;
    this.proofDocumentNote = proofDocumentNote;
    this.remark = remark;
    this.companyId = companyId;
    this.questionnaireType = questionnaireType;
    this.answeredAt = answeredAt,
      this.status = status;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}
