import { ModeOfTraining, QuestionType, TargetAudience } from '@utils/enums/Status';
import { Entity, PrimaryGeneratedColumn, CreateDateColumn, Column, UpdateDateColumn } from 'typeorm';
// Define the type explicitly (optional but helpful for type safety)
type Trainer = {
  name: string;
  is_external: boolean;
  user_id?: number;
};

@Entity('riu_training')
export class Training {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  financialYearId: number;

  @Column()
  trainingTitle: string;

  @Column({ type: 'json' })
  categoryIds: number[];

  @Column()
  locationId: number;

  @Column({ type: 'json' })
  trainingTopicID: number[];

  @Column({ type: 'json' })
  principlesId: number[];

  @Column({ type: 'json' })
  userId: number[];

  @Column({ type: 'json' })
  acceptedUserId: number[];

  @Column({ type: 'json' })
  nonAcceptedUserId: number[];

  @Column({ type: 'json' })
  attendantUserId: number[];

  @Column({ type: 'json' })
  nonAttendantUserId: number[];

  @Column()
  description: string;

  @Column()
  trainingFacilitator: string;

  @Column({ type: 'json' }) 
  trainers: Trainer[];     

  @Column()
  departmentId: number;

  @Column()
  fromDate: string;

  @Column()
  toDate: string;

  @Column()
  fromTime: string;

  @Column()
  toTime: string;

  @Column()
  targetAudience: string;

  @Column()
  registrationDeadline: string;

  @Column({ type: 'enum', enum: ModeOfTraining })
  modeOfTraining: ModeOfTraining;

  @Column()
  linkOrVenues: string;

  @Column()
  trainingLink: string;

  @Column()
  token: string;

  @Column()
  registerInternalQrLink: string;

  @Column()
  registerExternalQrLink: string;

  @Column()
  attendenceInternalQrLink: string;

  @Column()
  attendenceExternalQrLink: string;

  @Column()
  companyId: number;

  @Column()
  createdBy: number;

  @Column()
  status: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  constructor(
    financialYearId: number,
    trainingTitle: string,
    categoryIds: number[],
    trainingTopicID: number[],
    principlesId: number[],
    userId: number[],
    locationId:number,
    acceptedUserId: number[],
    nonAcceptedUserId: number[],
    attendantUserId: number[],
    nonAttendantUserId: number[],
    description: string,
    trainingFacilitator: string,
    trainers: Trainer[],  
    departmentId: number,
    fromDate: string,
    toDate: string,
    fromTime: string,
    toTime: string,
    targetAudience: string,
    registrationDeadline: string,
    modeOfTraining: ModeOfTraining,
    linkOrVenues: string,
    trainingLink: string,
    token: string,
    registerInternalQrLink: string,
    registerExternalQrLink: string,
    attendenceInternalQrLink: string,
    attendenceExternalQrLink: string,
    companyId: number,
    createdBy: number,
    status: number
  ) {
    this.financialYearId = financialYearId;
    this.trainingTitle = trainingTitle;
    this.categoryIds = categoryIds;
    this.trainingTopicID = trainingTopicID;
    this.principlesId = principlesId;
    this.userId = userId;
    this.locationId = locationId;
    this.acceptedUserId = acceptedUserId;
    this.nonAcceptedUserId = nonAcceptedUserId;
    this.attendantUserId = attendantUserId;
    this.nonAttendantUserId = nonAttendantUserId;
    this.description = description;
    this.trainingFacilitator = trainingFacilitator;
    this.trainers = trainers;
    this.departmentId = departmentId;
    this.fromDate = fromDate;
    this.toDate = toDate;
    this.fromTime = fromTime;
    this.toTime = toTime;
    this.targetAudience = targetAudience;
    this.registrationDeadline = registrationDeadline;
    this.modeOfTraining = modeOfTraining;
    this.linkOrVenues = linkOrVenues;
    this.trainingLink = trainingLink;
    this.token = token;
    this.registerInternalQrLink = registerInternalQrLink;
    this.registerExternalQrLink = registerExternalQrLink;
    this.attendenceInternalQrLink = attendenceInternalQrLink;
    this.attendenceExternalQrLink = attendenceExternalQrLink;
    this.companyId = companyId;
    this.createdBy = createdBy;
    this.status = status;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}
