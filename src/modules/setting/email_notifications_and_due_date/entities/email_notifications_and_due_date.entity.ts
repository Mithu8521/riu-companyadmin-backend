import { DueDateRule, DueDateType, QuestionFrequencyType } from '@utils/enums/Status';
import { Entity, PrimaryGeneratedColumn, CreateDateColumn, Column, UpdateDateColumn, OneToMany } from 'typeorm';
import { EmailNotificationsEntity } from './emial_notifications.entity';

@Entity('riu_question_due_date')
export class QuestionDueDateEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  financialYearId: number;

  @Column('json', { nullable: true })
  periodRecord: {
    displayName:string,
    fromDate: string;
    toDate: string;
  };

 @Column('json', { nullable: true })
  configuration: any;

  @Column({ type: 'enum', enum: QuestionFrequencyType })
  questionFrequencyType: QuestionFrequencyType;

  @Column({ type: 'enum', enum: DueDateType })
  dueDateType: DueDateType;

  @Column({ nullable: true })
  fixedDate: string;

  @Column({ type: 'enum', enum: DueDateRule, nullable: true })
  rule: DueDateRule;

  @Column({ nullable: true })
  ruleDays: number;

  @Column({ default: true })
  status: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => EmailNotificationsEntity, (notification) => notification.dueDateConfig)
  notifications: EmailNotificationsEntity[];

  constructor(
    userId: number,
    financialYearId: number,
    periodRecord: { fromDate: string; toDate: string; displayName: string },
    questionFrequencyType: QuestionFrequencyType,
    dueDateType: DueDateType,
    fixedDate: string,
    rule: DueDateRule,
    ruleDays: number,
    configuration: any,
  ) {
    this.userId = userId;
    this.financialYearId = financialYearId;
    this.periodRecord = periodRecord;
    this.questionFrequencyType = questionFrequencyType;
    this.dueDateType = dueDateType;
    this.fixedDate = fixedDate;
    this.rule = rule;
    this.ruleDays = ruleDays;
    this.configuration = configuration;
    this.status = true;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}