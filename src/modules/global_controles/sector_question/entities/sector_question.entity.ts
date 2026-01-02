import { GraphApplicable, IsDependent, PlateformType, QuestionType } from '@utils/enums/Status';
import { Entity, PrimaryGeneratedColumn, CreateDateColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('riu_sector_questions')
export class SectorQuestionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  companyId: number;

  @Column()
  frameworkId: number;

  @Column()
  topicId: number;

  @Column()
  kpiId: number;

  @Column({ type: "enum", enum: QuestionType })
  questionType: QuestionType;

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
  createdBy: number;

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
    frameworkId: number,
    topicId: number,
    kpiId: number,
    questionType: QuestionType,
    entity: PlateformType,
    graphApplicable: GraphApplicable,
    isDependent: IsDependent,
    heading: string,
    title: string,
    readingValue: string,
    createdBy: number,
    updatedBy: number,
    isDeletable: boolean,
  ) {
    this.companyId = companyId;
    this.frameworkId = frameworkId; 
    this.topicId = topicId;
    this.kpiId = kpiId;
    this.questionType = questionType;
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
