import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
} from 'typeorm';
import { createHash } from 'crypto';
import { CompanyEntity } from '@app/modules/setting/user/entities/user.entity';

@Entity('riu_answer_chat_messages')
@Index('idx_chat_identity_key', ['chatIdentityKey'])
export class ReportingChatEntity {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ name: 'questionId', type: 'int' })
  questionId: number;

  @Column({ name: 'financialYearId', type: 'int' })
  financialYearId: number;

  @Column({ name: 'sourceId', type: 'int', nullable: true })
  sourceId: number | null;

  @Column({ name: 'subLocationId', type: 'int', nullable: true })
  subLocationId: number | null;

  
  @Column({ name: 'fromDate', type: 'varchar', length: 7, nullable: true })
  fromDate: string | null;

  @Column({ name: 'toDate', type: 'varchar', length: 7, nullable: true })
  toDate: string | null;

  @Column({ name: 'senderId', type: 'int' })
  senderId: number;

  @ManyToOne(() => CompanyEntity, { eager: false })
  @JoinColumn({ name: 'senderId' })
  senderUser: CompanyEntity;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'json' })
  mentions: {
    isAll: boolean;
    userIds: number[];
  };

  @CreateDateColumn({ name: 'createdAt', type: 'datetime' })
  createdAt: Date;

  @Column({ name: 'chatIdentityKey', type: 'char', length: 64 })
  chatIdentityKey: string;

  @BeforeInsert()
  generateChatIdentityKey() {
    const rawKey = [
      this.questionId,
      this.financialYearId,
      this.sourceId ?? 'NULL',
      this.subLocationId ?? 'NULL',
      this.fromDate ?? 'NULL',
      this.toDate ?? 'NULL',
    ].join('_');

    this.chatIdentityKey = createHash('sha256')
      .update(rawKey)
      .digest('hex');
  }
}
