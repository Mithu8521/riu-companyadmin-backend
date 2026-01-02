import { QuestionnaireType, QuestionType } from '@utils/enums/Status';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('riu_reporting_question_target_data')
export class ReportingQuestionTargetDataEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  financialYearId: number;

  @Column()
  questionId: number;

  @Column({ type: 'enum', enum: QuestionType })
  questionType: QuestionType;

  @Column('text')
  questionTitle: string;

  @Column({ type: 'int', nullable: true })
  sourceId?: number;

  @Column({ type: 'int', nullable: true, name: 'sub_location_id' })
  subLocationId?: number;

  @Column({ type: 'varchar', length: 500, charset: 'utf8mb4', collation: 'utf8mb4_0900_ai_ci', nullable: true })
  fromDate?: string;

  @Column({ type: 'varchar', length: 500, charset: 'utf8mb4', collation: 'utf8mb4_0900_ai_ci', nullable: true })
  toDate?: string;

  @Column()
  minTargetData: string;

  @Column()
  maxTargetData: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  unit?: string;

  @Column({ type: 'tinyint', width: 1, nullable: true })
  status?: boolean;

  @Column()
  columnId?: number;

  @Column()
  rowId?: number;

  @Column()
  companyId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  constructor(
    userId: number,
    financialYearId: number,
    questionId: number,
    questionTitle: string,
    minTargetData: string,
    maxTargetData: string,
    questionType: QuestionType,
    sourceId?: number,
    subLocationId?: number,
    fromDate?: string,
    toDate?: string,
    status?: boolean,
    unit?: string,
    columnId?: number,
    rowId?: number,
    companyId?: number
  ) {
    this.userId = userId;
    this.financialYearId = financialYearId;
    this.questionId = questionId;
    this.questionTitle = questionTitle;
    this.sourceId = sourceId;
    this.subLocationId = subLocationId;
    this.fromDate = fromDate;
    this.toDate = toDate;
    this.minTargetData = minTargetData;
    this.maxTargetData = maxTargetData;
    this.columnId=columnId;
    this.rowId= rowId;
    this.unit = unit;
    this.status = status;
    this.questionType = questionType;
    this.companyId = companyId;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}
