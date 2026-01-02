import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
export class CreateEsgReportingDto {
  @ApiProperty()
  @IsNumber()
  financialYearId: number;

  @ApiProperty()
  @IsString()
  questionnaireType: string;

  @ApiProperty()
  @IsString()
  frameworkTopicKpi: string;

  @ApiProperty({ required: false})
  @IsNumber()
  @IsOptional()
  companyId: number;
 
  @ApiProperty({ required: false})
  @IsNumber()
  @IsOptional()
  createdBy: number;
}
