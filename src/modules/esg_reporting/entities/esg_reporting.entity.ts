import { Entity, PrimaryGeneratedColumn, CreateDateColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('riu_framework_topic_kpi_company')
export class EsgReportingEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  financialYearId: number;

  @Column()
  questionnaireType: string;

  @Column()
  frameworkTopicKpi: string;

  @Column()
  companyId: number;

  @Column()
  createdBy: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
  constructor( financialYearId: number,  questionnaireType: string,  frameworkTopicKpi: string,  companyId: number,   createdBy: number) {
    this.financialYearId = financialYearId;
    this.questionnaireType = questionnaireType;
    this.frameworkTopicKpi = frameworkTopicKpi;
    this.companyId = companyId;
    this.createdBy = createdBy;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}
