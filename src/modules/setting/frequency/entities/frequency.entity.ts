import { AnswerFrequency } from '@utils/enums/Status';
import { Entity, PrimaryGeneratedColumn, CreateDateColumn, Column, UpdateDateColumn } from 'typeorm';
@Entity('riu_answer_frequency')
export class AnswerFrequencyEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  financialYearId: number;

  @Column()
  moduleId: number;

  @Column({ type: 'enum', enum: AnswerFrequency })
  frequency: AnswerFrequency;

  @Column()
  isEditable: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  constructor(financialYearId: number, moduleId: number, frequency: any,  isEditable: boolean) {
    this.financialYearId = financialYearId;
    this.moduleId = moduleId;
    this.frequency = frequency;
    this.isEditable = isEditable;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}
