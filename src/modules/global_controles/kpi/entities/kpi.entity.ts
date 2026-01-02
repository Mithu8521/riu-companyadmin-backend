export class Kpi {}
import { Entity, PrimaryGeneratedColumn, CreateDateColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('riu_kpis')
export class KpiEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  topicId: number;

  @Column()
  kpiTitle: string;

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
    topicId: number,
    kpiTitle: string,
    questionCreated: boolean,
    createdBy: number,
    updatedBy: number,
    companyId: number,
    isDeletable: boolean,
  ) {
    this.topicId = topicId;
    this.kpiTitle = kpiTitle; 
    this.questionCreated = questionCreated;
    this.createdBy = createdBy;
    this.companyId = companyId;
    this.updatedBy = updatedBy;
    this.isDeletable = isDeletable;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}
