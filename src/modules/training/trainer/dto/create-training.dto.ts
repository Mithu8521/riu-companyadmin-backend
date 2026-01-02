import { ApiProperty } from '@nestjs/swagger';
import { ModeOfTraining, TargetAudience } from '@utils/enums/Status';
import { IsNotEmpty, IsNumber, IsString, IsEnum, IsArray, ArrayNotEmpty } from 'class-validator';

export class TrainerDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  is_external: boolean;

  @ApiProperty({ required: false })
  @IsNumber()
  user_id?: number;
}
export class CreateTrainingDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  financialYearId: number;

  @ApiProperty({ type: [Number] })  
  @IsNotEmpty()
  @IsArray()
  @ArrayNotEmpty()                
  @IsNumber({}, { each: true })
  categoryIds: number[];

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  trainingTitle: string;

  @ApiProperty({ type: [Number] })
  @IsNotEmpty()
  @IsArray()
  @ArrayNotEmpty() 
  @IsNumber({}, { each: true })
  trainingTopicID: number[];

  @ApiProperty({ type: [Number] })  
  @IsNotEmpty()
  @IsArray()
  @ArrayNotEmpty()                
  @IsNumber({}, { each: true })
  principlesId: number[];

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  trainingFacilitator: string;

  @ApiProperty({ type: [TrainerDto] })
  @IsArray()
  @ArrayNotEmpty()
  trainers: TrainerDto[];

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  departmentId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  fromDate: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  toDate: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  fromTime: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  toTime: string;

  // @ApiProperty({ enum: TargetAudience, isArray: true }) 
  // @IsNotEmpty()
  // @IsArray()
  // @IsEnum(TargetAudience, { each: true }) 
  // targetAudience: TargetAudience[];

  @ApiProperty({nullable : true})  
  @IsString()  
  registrationDeadline: string;

  @ApiProperty({ enum: ModeOfTraining })
  @IsNotEmpty()
  @IsEnum(ModeOfTraining)
  modeOfTraining: ModeOfTraining;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  linkOrVenues: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  companyId: number;
}
