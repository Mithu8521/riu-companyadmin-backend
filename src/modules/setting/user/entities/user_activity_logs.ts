import { Entity, PrimaryGeneratedColumn, CreateDateColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('riu_user_activity_logs')
export class UserActivityLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 500 })
  message: string; 

  @Column({ length: 100 })
  eventType: string;

  @Column({ type: 'text' })
  status: string;

  @Column()
  userId: number;

  @Column()
  sourceId: number;

  @Column({ nullable: true })
  questionId: number;

  @Column({ nullable: true, length: 45 })
  ipAddress: string;

  @Column({ nullable: true, length: 255 })
  userAgent: string;

  @Column({ nullable: true, length: 255 })
  location: string;

  @Column({ type: 'json', nullable: true })
  viewableChanges: object;

  @Column({ type: 'json', nullable: true })
  metadata: object;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  constructor(
    message: string,
    eventType: string,
    status: string,
    userId: number,
    sourceId: number,
    questionId?: number,
    ipAddress?: string,
    userAgent?: string,
    location?: string,
    viewableChanges?: object,
    metadata?: object
  ) {
    this.message = message;
    this.eventType = eventType;
    this.status = status;
    this.userId = userId;
    this.sourceId = sourceId;
    this.questionId = questionId || null;
    this.ipAddress = ipAddress || null;
    this.userAgent = userAgent || null;
    this.location = location || null;
    this.viewableChanges = viewableChanges || null;
    this.metadata = metadata || null;
  }

  /**
   * Create a log entry for a user action
   */
  static createLog(
    message: string,
    eventType: string,
    status: string,
    userId: number,
    sourceId: number,
    options?: {
      questionId?: number;
      ipAddress?: string;
      userAgent?: string;
      location?: string;
      viewableChanges?: object;
      metadata?: object;
    }
  ): UserActivityLog {
    return new UserActivityLog(
      message,
      eventType,
      status,
      userId,
      sourceId,
      options?.questionId,
      options?.ipAddress,
      options?.userAgent,
      options?.location,
      options?.viewableChanges,
      options?.metadata
    );
  }
}