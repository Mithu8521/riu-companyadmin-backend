import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';

@Entity({ name: 'riu_raw_events' })
@Index('uniq_raw_events_event_hash', ['eventHash'], { unique: true })
export class RawEvent {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  receivedTime!: Date;

  @Column({ type: 'jsonb' })
  payload!: any;

  @Column({ default: 'PENDING' })
  status!: string;

  @Column({ default: 0 })
  retryCount!: number;

  @Column({ nullable: true })
  errorReason?: string;

  @Column()
  eventHash!: string;
}
