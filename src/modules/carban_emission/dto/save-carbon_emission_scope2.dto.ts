import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNumber,
  IsDate,
  IsBoolean,
  IsOptional,
  IsJSON,
  IsNotEmpty,
  IsString
} from 'class-validator';

export class SaveEmissionScope2CalculationDto {

  @ApiProperty({
    description: 'Financial Year ID',
    example: 2024
  })
  @IsNumber()
  @IsNotEmpty()
  financialYearId: number;

  @ApiProperty({
    description: 'GHG Database ID',
    example: 1
  })
  @IsNumber()
  @IsNotEmpty()
  ghgDatabaseId: number;

  @ApiProperty({
    description: 'Calculation ID',
    example: 1
  })
  @IsNumber()
  @IsNotEmpty()
  calculationId: number;

  @ApiProperty({
    description: 'Question ID',
    example: 1,
    required: false,
    nullable: true
  })
  @IsOptional()
  questionId?: any;

  @ApiProperty({
    description: 'Source ID',
    example: 1
  })
  @IsNumber()
  @IsNotEmpty()
  sourceId: number;

  @ApiProperty({
    description: 'Source ID',
    example: 1
  })
  @IsNumber()
  @IsNotEmpty()
  period: number;

  @ApiProperty({
    description: 'Sub Location ID',
    example: 1,
    required: false
  })
  @IsNumber()
  @IsOptional()
  subLocationId?: number;

  @ApiProperty({
  })
  @IsString()
  @IsNotEmpty()
  unit: string;

  @ApiProperty({
    description: 'From Date',
    example: '2024-01-01'
  })
  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  fromDate: Date;

  @ApiProperty({
    description: 'To Date',
    example: '2024-12-31'
  })
  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  toDate: Date;

  @ApiProperty({
    description: 'Consumed Amount',
    example: 100.5,
    default: 0
  })
  @IsNumber()
  @IsNotEmpty()
  consumedAmount: number;

  @ApiProperty({
    description: 'Calculation Details',
    type: 'json'
  })
  @IsJSON()
  @IsNotEmpty()
  calculationDetails: any;

  @ApiProperty({
    description: 'Status',
    example: true,
    default: true,
    required: false
  })
  @IsBoolean()
  @IsOptional()
  status?: boolean;
}