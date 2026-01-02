import { QuestionStatus, QuestionType, QuestionnaireType } from '@utils/enums/Status';
import { Entity, PrimaryGeneratedColumn, CreateDateColumn, Column, UpdateDateColumn } from 'typeorm';
@Entity('riu_reporting_question_answer')
export class ReportingQuestionAnswerEntity {
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

  @Column({ nullable: true })
  subLocationId: number;  

  @Column()
  fromDate: string;

  @Column()
  toDate: string;

  @Column()
  moduleId: number;  

  @Column({ nullable: true })
  notApplicable: boolean;
  
  @Column()
  answer: string;

  @Column("json")
  proofDocument: any[];

  @Column("json", { nullable: true })
  proofDocumentNote: string[][];

  @Column({ type: 'enum', enum: QuestionStatus })
  status: QuestionStatus;

  @Column("json", { nullable: true })
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
