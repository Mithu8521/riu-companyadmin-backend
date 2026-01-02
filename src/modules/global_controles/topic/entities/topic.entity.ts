export class Topic {}
import { Entity, PrimaryGeneratedColumn, CreateDateColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('riu_topics')
export class TopicEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  frameworkId: number;

  @Column()
  topicTitle: string;

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
    frameworkId: number,
    topicTitle: string,
    kpiCreated: boolean,
    questionCreated: boolean,
    createdBy: number,
    updatedBy: number,
    companyId: number,
    isDeletable: boolean,
  ) {
    this.frameworkId = frameworkId;
    this.topicTitle = topicTitle; 
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
