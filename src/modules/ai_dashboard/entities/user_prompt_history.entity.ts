import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('riu_user_prompt_history')
export class UserPromptHistoryEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'user_id', type: 'bigint' })
  userId: number;

  @Column({ name: 'prompt_history_id', type: 'bigint' })
  promptHistoryId: number;

  @Column({ type: 'text' })
  query: string;

  @Column({ type: 'text' })
  script: string;

  @Column({ type: 'text' })
  response: string;

  @Column({ type: 'text' })
  feedback: string;

  @Column({ type: 'tinyint', default: 1 })
  status: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  constructor(userId: number, promptHistoryId: number, query: string, script: string, response: string, feedback: string, status: number = 1) {
    this.userId = userId;
    this.promptHistoryId = promptHistoryId;
    this.query = query;
    this.script = script;
    this.response = response;
    this.feedback = feedback;
    this.status = status;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}
