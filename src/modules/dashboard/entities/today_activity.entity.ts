import { Entity, PrimaryGeneratedColumn, CreateDateColumn, Column, UpdateDateColumn } from 'typeorm';
@Entity('riu_todays_activity')
export class TodaysActivity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  massage: string;

  @Column()
  status: string;  

  @Column()
  userId: number;

  @Column()
  questionId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  constructor(massage: string, status: string, userId: number, questionId: number) {
    this.massage = massage;
    this.status = status;
    this.userId = userId;
    this.questionId = questionId;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}
