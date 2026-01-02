import { Entity, PrimaryGeneratedColumn, CreateDateColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('riu_frameworks')
export class FrameworkEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  frameworkTitle: string;

  @Column()
  financialYearId: number;

  @Column()
  topicCreated: boolean;

  @Column()
  kpiCreated: boolean;

  @Column()
  questionCreated: boolean;

  @Column()
  createdBy: number;

  @Column()
  updatedBy: number;

  @Column()
  companyId: number;

  @Column()
  isDeletable: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
  constructor(
    frameworkTitle: string,
    financialYearId: number,
    topicCreated: boolean,
    kpiCreated: boolean,
    questionCreated: boolean,
    createdBy: number,
    updatedBy: number,
    companyId: number,
    isDeletable: boolean,
  ) {
    this.frameworkTitle = frameworkTitle;
    this.financialYearId = financialYearId;
    this.topicCreated = topicCreated;
    this.kpiCreated = kpiCreated;
    this.questionCreated = questionCreated;
    this.createdBy = createdBy;
    this.companyId = companyId;
    this.updatedBy = updatedBy;
    this.isDeletable = isDeletable;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}
