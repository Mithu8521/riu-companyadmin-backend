import {
    Entity,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    Column,
    UpdateDateColumn,
  } from 'typeorm';
  
  @Entity('riu_email_history')
  export class EmailHistoryEntity {
    @PrimaryGeneratedColumn()
    id: number;
  
    @Column()
    email: string;

    @Column({ type: 'text', nullable: true })
    ccList: string;
  
    @Column()
    event: string;
  
    @Column()
    status: boolean;
  
    @Column('simple-json')
    payload: Record<string, any>; // stores all email-related data as JSON
  
    @CreateDateColumn()
    createdAt: Date;
  
    @UpdateDateColumn()
    emailSendTime: Date;
  
    constructor(
      email: string,
      event: string,
      status: boolean,
      payload: Record<string, any>
    ) {
      this.email = email;
      this.event = event;
      this.status = status;
      this.payload = payload;
    }
  }
  