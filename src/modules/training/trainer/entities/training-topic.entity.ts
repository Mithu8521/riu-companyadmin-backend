import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('riu_training_topic')
export class TrainingTopic {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ 
    type: 'varchar', 
    length: 255,
    nullable: false 
  })
  topic: string;

  @Column({ 
    name: 'training_principle_id',
    type: 'json',
    nullable: false 
  })
  trainingPrincipleId: any; 

  @Column({ 
    name: 'created_by',
    type: 'int',
    nullable: false,
    default: 1 
  })
  createdBy: number;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP'
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP'
  })
  updatedAt: Date;

  constructor(
    topic: string,
    trainingPrincipleId: any,
    createdBy: number = 1
  ) {
    this.topic = topic;
    this.trainingPrincipleId = trainingPrincipleId;
    this.createdBy = createdBy;
  }
}