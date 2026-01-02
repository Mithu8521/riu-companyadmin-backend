import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsDateString,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DocumentType, BillMetadata, OthersMetadata } from '../entities/document.entity';
import { ReportingQuestionMetaDto } from './reporting-question-meta.dto';

export class SaveDocumentDto {
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  id: number;

  @IsEnum(DocumentType)
  documentType: DocumentType;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  financialYearId: number;

  @IsString()
  @IsOptional()
  moduleName: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  sourceId: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  subLocationId: number;

  @IsString()
  @IsOptional()
  frequency: string;

  @IsDateString()
  @IsOptional()
  fromDate: string;

  @IsDateString()
  @IsOptional()
  toDate: string;

  @IsNotEmpty()
  documentMetadata: BillMetadata | OthersMetadata;

  @IsString()
  fileMetadataId: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ReportingQuestionMetaDto)
  reportingQuestionMeta?: ReportingQuestionMetaDto;

  @IsBoolean()
  addToReporting = false;
}
