import { GraphApplicable, IsDependent, PlateformAdminType, PlateformType, QuestionType } from '@utils/enums/Status';
import { Entity, PrimaryGeneratedColumn, CreateDateColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('riu_assessment_questions')
export class AssessmentQuestionEntity {
  @PrimaryGeneratedColumn()
  id: number;
  
  @Column()
  companyId: number;

  @Column()
  financialYearId: number;

  @Column({ type: "enum", enum: QuestionType })
  questionType: QuestionType;

  @Column()
  questionId: number;  

  @Column({ type: "enum", enum: PlateformType })
  entity: PlateformType;

  @Column({ type: "enum", enum: GraphApplicable })
  graphApplicable: GraphApplicable;

  @Column({ type: "enum", enum: IsDependent })
  isDependent: IsDependent;

  @Column()
  heading: string;

  @Column()
  title: string;

  @Column()
  readingValue: string;

  @Column()
  createdBy: PlateformAdminType;

  @Column()
  updatedBy: number;

  @Column()
  isDeletable: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  constructor(
    companyId: number,
    financialYearId: number,
    questionType: QuestionType,
    questionId: number,
    entity: PlateformType,
    graphApplicable: GraphApplicable,
    isDependent: IsDependent,
    heading: string,
    title: string,
    readingValue: string,
    createdBy: PlateformAdminType,
    updatedBy: number,
    isDeletable: boolean,
  ) {
    this.companyId = companyId;
    this.financialYearId = financialYearId;
    this.questionType = questionType;
    this.questionId = questionId;
    this.entity = entity;
    this.graphApplicable = graphApplicable;
    this.isDependent = isDependent;
    this.readingValue = readingValue;
    this.title = title;
    this.heading = heading;
    this.createdBy = createdBy;
    this.companyId = companyId;
    this.updatedBy = updatedBy;
    this.isDeletable = isDeletable;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}
