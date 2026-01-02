import { QuestionStatus, QuestionType, QuestionnaireType } from '@utils/enums/Status';
import { Entity, PrimaryGeneratedColumn, CreateDateColumn, Column, UpdateDateColumn } from 'typeorm';
@Entity('riu_reporting_question_answer_history')
export class ReportingQuestionHistoryAnswerEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  financialYearId: number;

  @Column()
  questionId: number;

  @Column()
  sourceId: number;

  @Column()
  subLocationId: number;  

  @Column()
  fromDate: string;

  @Column()
  toDate: string;

  @Column()
  moduleId: number;  

  @Column()
  notApplicable: boolean;
  
  @Column()
  answer: string;

  @Column()
  answerDate: string;

  @Column("json")
  proofDocument: string[][];

  @Column("json")
  proofDocumentNote: string[][];

  @Column({ type: 'enum', enum: QuestionStatus })
  status: QuestionStatus;

  @Column("json")
  note: string[][];

  @Column({ type: 'enum', enum: QuestionType })
  questionType: QuestionType;

  @Column()
  companyId: number;

  @Column({ type: 'enum', enum: QuestionnaireType })
  questionnaireType: QuestionnaireType;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  constructor(
    userId: number,
    financialYearId: number,
    questionId: number,
    sourceId: number,
    subLocationId: number,
    moduleId: number,
    fromDate: string,
    toDate: string,
    notApplicable: boolean,
    answer: string,
    answerDate: string,
    proofDocument: string[][],
    proofDocumentNote: string[][],
    status: QuestionStatus,
    note: string[][],    
    questionType: QuestionType,
    companyId: number,
    questionnaireType: QuestionnaireType,
  ) {
    this.userId = userId;
    this.financialYearId = financialYearId;
    this.questionId = questionId;
    this.sourceId = sourceId;
    this.subLocationId = subLocationId;    
    this.moduleId = moduleId;
    this.fromDate = fromDate;
    this.toDate = toDate;
    this.notApplicable = notApplicable;
    this.answer = answer;
    this.answerDate = answerDate;    
    this.proofDocument = proofDocument;
    this.proofDocumentNote = proofDocumentNote;
    this.status = status;
    this.note = note;
    this.questionType = questionType;
    this.companyId = companyId;
    this.questionnaireType = questionnaireType;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}
