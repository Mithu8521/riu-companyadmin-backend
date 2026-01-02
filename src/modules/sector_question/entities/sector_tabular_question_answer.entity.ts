import {
  QuestionStatus,
  QuestionType,
  QuestionnaireType,
} from '@utils/enums/Status';
import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';

@Entity('riu_tabular_question_answer')
export class SectorQuestionTabularAnswerEntity {
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
  note: string;

  @Column()
  notApplicable: string;

  @Column()
  performed: boolean;

  @Column({ type: 'json', nullable: true }) 
  proofDocument: any;

  @Column('json')
  proofDocumentNote: string;

  @Column()
  remark: string;

  @Column()
  companyId: number;

  @Column({ type: 'enum', enum: QuestionnaireType })
  questionnaireType: QuestionnaireType;

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
    note: string,
    notApplicable: string,
    performed: boolean,
    proofDocument: any, // ✅ corrected from string[][]
    proofDocumentNote: string,
    remark: string,
    companyId: number,
    questionnaireType: QuestionnaireType,
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
    this.note = note;
    this.notApplicable = notApplicable;
    this.performed = performed;
    this.proofDocument = proofDocument; // ✅ now matches column
    this.proofDocumentNote = proofDocumentNote;
    this.remark = remark;
    this.companyId = companyId;
    this.questionnaireType = questionnaireType;
    this.status = status;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}
