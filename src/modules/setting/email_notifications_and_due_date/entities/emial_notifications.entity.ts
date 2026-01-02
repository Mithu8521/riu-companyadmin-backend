import {
  EmailNotificationsStatus,
  NotificationsTypeEnum,
} from '@utils/enums/Status';
import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Column,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { QuestionDueDateEntity } from './email_notifications_and_due_date.entity';

@Entity('riu_email_notifications')
export class EmailNotificationsEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  dueDateConfigId: number;

  @Column()
  userId: number;

  @Column({type: 'text', nullable: true})
  ccList: string;

  @Column()
  financialYearId: number;

  @Column('json', { nullable: true })
  periodRecord: {
    fromDate: string;
    toDate: string;
    periodLevel?: string;
  };

  @Column({
    type: 'enum',
    enum: NotificationsTypeEnum,
  })
  notificationsType: NotificationsTypeEnum;

  @Column({ type: 'timestamp' })
  notificationsDateTime: Date;

  @Column({ type: 'timestamp' })
  validTillTime: Date;

  @Column({
    type: 'enum',
    enum: EmailNotificationsStatus,
    default: EmailNotificationsStatus.PENDING
  })
  status: EmailNotificationsStatus;

  @Column({ type: 'json', nullable: true })
  recipientEmailsStautsId: number[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => QuestionDueDateEntity, (dueDate) => dueDate.notifications)
  @JoinColumn({ name: 'due_date_config_id' })
  dueDateConfig: QuestionDueDateEntity;

  constructor(
    dueDateConfigId: number,
    userId: number,
    financialYearId: number,
    periodRecord: { fromDate: string; toDate: string; periodLevel?: string },
    notificationsType: NotificationsTypeEnum,
    notificationsDateTime: Date,
    validTillTime:Date,
    status: EmailNotificationsStatus = EmailNotificationsStatus.PENDING,
    recipientEmailsStautsId: number[],
  ) {
    this.dueDateConfigId = dueDateConfigId;
    this.userId = userId;
    this.financialYearId = financialYearId;
    this.periodRecord = periodRecord;
    this.notificationsType = notificationsType;
    this.notificationsDateTime = notificationsDateTime;
    this.validTillTime = validTillTime,
    this.status = status;
    this.recipientEmailsStautsId = recipientEmailsStautsId ?? [];
  }
}
