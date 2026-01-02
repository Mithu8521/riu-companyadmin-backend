import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('riu_web_notifications')
@Index(['recipientUserId', 'isRead'])
export class WebNotificationEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  recipientUserId: number;

  @Column({ nullable: true })
  senderId: number;

  @Column({ nullable: true })
  senderName: string;

  @Column({ length: 50 })
  type: string;

  @Column({ length: 255, nullable: true })
  title: string;

  @Column({ type: 'text', nullable: true })
  body: string;

  @Column({ type: 'json', nullable: true })
  metadata: any;

  @Column({ default: false })
  isRead: boolean;

  @Column({ default: false })
  isDelivered: boolean;

  @Column({ type: 'json', nullable: true })
  channel: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
