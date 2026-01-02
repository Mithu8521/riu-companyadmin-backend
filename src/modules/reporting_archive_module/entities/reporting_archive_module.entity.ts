import { QuestionType, QuestionnaireType } from '@utils/enums/Status';
import { Entity, PrimaryGeneratedColumn, CreateDateColumn, Column, UpdateDateColumn } from 'typeorm';
@Entity('riu_reporting_archive_answer')
export class ReportingArchiveEntity {
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
  fromDate: string;

  @Column()
  toDate: string;

  @Column()
  moduleId: number;  

  @Column()
  notApplicable: boolean;

  @Column()
  answer: string;

  @Column("json")
  proofDocument: string[][];

  @Column("json")
  proofDocumentNote: string[][];

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
    moduleId: number,
    fromDate: string,
    toDate: string,
    notApplicable: boolean,
    answer: string,
    proofDocument: string[][],
    proofDocumentNote: string[][],
    note: string[][],    
    questionType: QuestionType,
    companyId: number,
    questionnaireType: QuestionnaireType,
  ) {
    this.userId = userId;
    this.financialYearId = financialYearId;
    this.questionId = questionId;
    this.sourceId = sourceId;
    this.moduleId = moduleId;
    this.fromDate = fromDate;
    this.toDate = toDate;
    this.notApplicable = notApplicable;
    this.answer = answer;
    this.proofDocument = proofDocument;
    this.proofDocumentNote = proofDocumentNote;
    this.note = note;
    this.questionType = questionType;
    this.companyId = companyId;
    this.questionnaireType = questionnaireType;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}
