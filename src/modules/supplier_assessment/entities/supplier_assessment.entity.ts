import { Entity, PrimaryGeneratedColumn, CreateDateColumn, Column, UpdateDateColumn } from 'typeorm';
@Entity('riu_supplier_assessment')
export class SupplierAssessmentEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  financialYearId: number;

  @Column()
  questionIds: string;

  @Column()
  userIds: string;

  @Column()
  isEditable: boolean;

  @Column()
  isDeletable: boolean;

  @Column()
  isAssignable: boolean;

  @Column()
  companyId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  constructor(title: string, financialYearId: number, questionIds: string, userIds: string, isEditable: boolean, isDeletable: boolean, isAssignable: boolean, companyId: number) {
    this.title = title;
    this.financialYearId = financialYearId;
    this.questionIds = questionIds;
    this.userIds = userIds;
    this.isEditable = isEditable;
    this.isDeletable = isDeletable;
    this.isAssignable = isAssignable;
    this.companyId = companyId;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}
