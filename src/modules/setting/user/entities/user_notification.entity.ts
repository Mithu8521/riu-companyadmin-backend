import { Entity, PrimaryGeneratedColumn, CreateDateColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('riu_notification_massage_activity')
export class UserNotificationEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  massage: string;

  @Column('json', { nullable: true })
  questionIds: string; // Corrected property name

  @Column()
  userId: number;

  @Column()
  createdBy: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  constructor(
    massage: string, 
    questionIds: number[], 
    userId: number,
    createdBy: number, 
  ) {
    this.massage = massage;
    this.questionIds = JSON.stringify(questionIds);
    this.userId = userId;
    this.createdBy = createdBy;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}
