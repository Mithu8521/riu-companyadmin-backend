import { Type } from 'class-transformer';
import { Matches, IsNumber, IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';
import { IntensityType } from '../enums/intensity-type.enum';

export class IntensityMetricDto {
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  financialYearId: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sourceId: number;
  
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  subLocationId: number;

  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
      message: 'fromDate must be in YYYY-MM format',
  })
  fromDate: string;

  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
      message: 'fromDate must be in YYYY-MM format',
  })
  toDate: string;

  @IsEnum(IntensityType, {
  message: `intensityType must be one of: ${Object.values(IntensityType).join(', ')}`,
  })
  @IsNotEmpty()
  intensityType: IntensityType;

  @IsNumber()
  metricValue: number;
}
