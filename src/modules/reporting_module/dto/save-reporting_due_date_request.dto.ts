import { Type } from 'class-transformer';
import { ValidateNested, IsArray } from 'class-validator';
import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';

export class SaveReportingDueDateItemDto {
  @IsNotEmpty()
  @IsNumber()
  financialYearId: number;

  @IsNotEmpty()
  @IsNumber()
  questionId: number;

  @IsNotEmpty()
  @IsNumber()
  sourceId: number;

  @IsOptional()
  @IsString()
  fromDate: string;

  @IsOptional()
  @IsString()
  toDate: string;
}

export class SaveReportingDueDateBulkRequestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaveReportingDueDateItemDto)
  overrideRequests: SaveReportingDueDateItemDto[];
}
