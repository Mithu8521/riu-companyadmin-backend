import { ApiProperty } from '@nestjs/swagger';
import { GHGScope } from '@utils/enums/Status';
import { Type } from 'class-transformer';
import {
  IsNumber,
  IsBoolean,
  IsOptional,
  IsJSON,
  IsNotEmpty,
  IsString,
  IsEnum,
  Matches
} from 'class-validator';

export class SaveEmissionCalculationDto {
  @ApiProperty({
    description: 'Emission Calculation ID',
    example: 12
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  id?: number;

  @ApiProperty({
    description: 'Financial Year ID',
    example: 2024
  })
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  financialYearId: number;

  @ApiProperty({
    description: 'GHG Database ID',
    example: 1
  })
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  ghgDatabaseId: number;

  @ApiProperty({
    description: 'GHG Scope Type',
    example: GHGScope.SCOPE1,
    enum: GHGScope,
  })
  @IsEnum(GHGScope)
  @IsNotEmpty()
  ghgScope: GHGScope;

  @ApiProperty({
    description: 'Question ID',
    example: 1,
    required: false,
    nullable: true
  })
  @IsOptional()
  @Type(() => Number)
  questionId?: any;

  @ApiProperty({
    description: 'Source ID',
    example: 1
  })
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  sourceId: number;

  @ApiProperty({
    description: 'Sub Location ID',
    example: 1,
    required: false
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  subLocationId?: number;

  @ApiProperty({
    description: 'From Date in YYYY-MM format',
    example: '2024-01',
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'fromDate must be in YYYY-MM format',
  })
  @Type(() => String)
  fromDate: string;

  @ApiProperty({
    description: 'To Date in YYYY-MM format',
    example: '2024-12',
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'toDate must be in YYYY-MM format',
  })
  @Type(() => String)
  toDate: string;

  @ApiProperty({
    description: 'Input Details',
    type: 'json'
  })
  @IsJSON()
  @IsNotEmpty()
  @Type(() => Object)
  inputDetails: any;

  @ApiProperty({
    description: 'Status',
    example: true,
    default: true,
    required: false
  })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  status?: boolean;
}
