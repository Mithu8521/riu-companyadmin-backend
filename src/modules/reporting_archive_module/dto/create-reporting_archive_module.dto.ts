import { IsNotEmpty, IsString, IsNumber, IsArray, IsOptional, IsBoolean} from 'class-validator';

export class SaveReportingArchiveModuleDto {
  @IsNotEmpty()
  @IsNumber()
  questionId: number;

  @IsNotEmpty()
  @IsNumber()
  moduleId: number;

  @IsOptional()
  @IsNumber()
  sourceId?: number;

  @IsOptional()
  @IsString()
  fromDate: string;

  @IsOptional()
  @IsString()
  toDate: string;

  @IsOptional()
  @IsBoolean()
  notApplicable?: boolean;

  answer?: string;

  @IsOptional()
  @IsArray()
  proofDocument?: string[][];

  @IsOptional()
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
