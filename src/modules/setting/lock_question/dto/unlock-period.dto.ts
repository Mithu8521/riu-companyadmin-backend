import { IsNotEmpty, IsNumber, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UnlockPeriodDto {
  @ApiProperty({ description: 'Financial Year ID', example: 1 })
  @IsNotEmpty()
  @IsNumber()
  financialYearId: number;

  @ApiProperty({ description: 'Period Value', example: 1 })
  @IsNotEmpty()
  @IsNumber()
  periodValue: number;

  @ApiProperty({ description: 'Frequency', example: 'MONTHLY' })
  @IsNotEmpty()
  @IsString()
  frequency: string;

  @ApiProperty({ description: 'Reason for unlocking', example: 'Need to update data', required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}