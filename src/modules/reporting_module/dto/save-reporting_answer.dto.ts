import { IsNotEmpty, IsString, IsNumber, ValidateNested, IsArray, IsOptional, IsBoolean, ArrayNotEmpty } from 'class-validator';

export class SaveAnswerReportingQuestionDto {
  @IsNotEmpty()
  @IsNumber()
  financialYearId: number;

  @IsNotEmpty()
  @IsNumber()
  questionId: number;

  @IsNotEmpty()
  @IsString()
  questionTitle: string;

  @IsNotEmpty()
  @IsNumber()
  moduleId: number;

  @IsOptional()
  @IsNumber()
  sourceId?: number;

  @IsOptional()
  @IsNumber()
  subLocationId?: number;

  @IsOptional()
  @IsString()
  fromDate: string;

  @IsOptional()
  @IsString()
  toDate: string;

  // @IsNotEmpty()
  @IsOptional()
  // @IsNumber()
  readingValue?: number;

  @IsOptional()
  @IsBoolean()
  notApplicable?: boolean;

  @IsOptional()
  @IsString()
  answer?: string;

  @IsOptional()
  @IsArray()
  // @ArrayNotEmpty({ each: true }) // Ensure each sub-array is not empty
  proofDocument?: string[][];

  @IsOptional()
  // @ValidateNested({ each: true })
  @IsArray()
  proofDocumentNote?: string[][];

  @IsOptional()
  @IsArray()
  note: string[][];

  @IsNotEmpty()
  @IsString()
  questionType: 'qualitative' | 'yes_no' | 'quantitative' | 'tabular_question' | 'quantitative_trends';

  @IsNotEmpty()
  @IsString()
  frequency: 'ONE_TIME' | 'EVERY_FY' | 'CUSTOM' ;
}
