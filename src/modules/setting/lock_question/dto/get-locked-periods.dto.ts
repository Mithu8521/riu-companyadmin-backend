import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class GetLockedPeriodsDto {
  @ApiProperty({ description: 'Financial Year ID', example: 1 })
  @IsNotEmpty()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  financialYearId: number;

}