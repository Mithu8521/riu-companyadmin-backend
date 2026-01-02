import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('riu_invited_trainee')
export class InvitedTrainee {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  constructor(
    email: string,
  ) {
    this.email = email;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}
