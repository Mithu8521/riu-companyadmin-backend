import { IsNumber, IsEnum, IsOptional } from 'class-validator';
import { IntensityType } from '../enums/intensity-type.enum';
import { Type } from 'class-transformer';

export class GetIntensityDto {
  @Type(() => Number)
  @IsNumber()
  financialYearId: number;

  @IsOptional()
  @IsEnum(IntensityType, {
    message: `intensityType must be one of: ${Object.values(IntensityType).join(', ')}`,
  })
  intensityType?: IntensityType;
}