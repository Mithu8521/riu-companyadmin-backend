import { ApiProperty } from '@nestjs/swagger';
import { PlateformType } from '@utils/enums/Status';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
export class CreateSectorQuestionDto {
  @ApiProperty()
  @IsNumber()
  frameworkId: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  topicId: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  kpiId: number;

  @ApiProperty()
  entity: PlateformType;

  @ApiProperty()
  @IsString()  
  questions: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  createdBy: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  updatedBy: number;

  @ApiProperty({ default: true, required: false })
  @IsBoolean()
  @IsOptional()
  isDeletable: boolean;
}
