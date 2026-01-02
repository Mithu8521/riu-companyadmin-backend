import { Type } from "class-transformer";
import { IsBoolean, IsNumber, IsOptional, IsString } from "class-validator";


export class ReportingQuestionMetaDto {
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  questionId: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  row: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  readingColumn: number;

  @IsBoolean()
  addReadings: boolean = false;
}