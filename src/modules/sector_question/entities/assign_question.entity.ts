import { Entity, PrimaryGeneratedColumn, CreateDateColumn, Column, UpdateDateColumn } from 'typeorm';

import { ModuleType, QuestionnaireType } from '@utils/enums/Status';
@Entity('riu_assigned_reporting_questionnaire')
export class AssignQuestionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  financialYearId: number;

  @Column({ type: 'enum', enum: ModuleType })
  moduleType: ModuleType;

  @Column({ type: 'enum', enum: QuestionnaireType })
  questionnaireType: QuestionnaireType;

  @Column('simple-array')
  assignedTo: number[];

  @Column()
  assignedBy: number;

  @Column('simple-array') 
  sourceIds: number[];

  @Column() 
  questionId: number;

  @Column('simple-array')
  viewQuestion: number[];

  @Column()
  answerable: boolean;

  @Column()
  companyId: number;

  @Column()
  dueDate: Date;

  @Column()
  dueDateRequested: boolean;

  @Column()
  status: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  constructor(
    financialYearId: number,
    moduleType: ModuleType,
    questionnaireType: QuestionnaireType,
    assignedTo: number[], 
    assignedBy: number,
    sourceIds: number[], 
    questionId: number,
    viewQuestion: number[],
    answerable: boolean,
    companyId: number,
    dueDate: Date,
    dueDateRequested: boolean,
    status: boolean,
  ) {
    this.financialYearId = financialYearId;
    this.moduleType = moduleType;
    this.assignedTo = assignedTo;
    this.questionnaireType = questionnaireType;
    this.assignedBy = assignedBy;
    this.sourceIds = sourceIds;
    this.companyId = companyId;
    this.questionId = questionId;
    this.viewQuestion = viewQuestion;
    this.answerable = answerable;
    this.dueDate = dueDate;
    this.dueDateRequested = dueDateRequested;
    this.status = status;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}
