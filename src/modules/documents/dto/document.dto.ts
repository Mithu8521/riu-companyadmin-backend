import { Expose, Type } from 'class-transformer';
import { DocumentType, BillMetadata, OthersMetadata } from '../entities/document.entity';
import { FileMetadataDTO } from '@app/modules/files-manager/dto/file-metadata.dto';
import { IsOptional } from 'class-validator';

export class DocumentDto {
  @Expose()
  id: number;

  @Expose()
  documentType: DocumentType;

  @Expose()
  financialYearId: number;

  @Expose()
  sourceId: number;

  @Expose()
  subLocationId: number;

  @Expose()
  frequency: string;

  @Expose()
  fromDate: string;

  @Expose()
  toDate: string;

  @Expose()
  documentMetadata: BillMetadata | OthersMetadata;

  @Expose()
  moduleName: string;

  @Expose()
  fileMetadataId: string;

  @Expose()
  @Type(() => FileMetadataDTO)
  fileMetadata: FileMetadataDTO;

  @Expose()
  @IsOptional()
  isExisting: boolean = false;

  @Expose()
  reportingQuestionIds: string[];

  @Expose()
  addToReporting: boolean = false;

  @Expose()
  reportingQuestionMeta: any;

  @Expose()
  createdById: number;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  deletedAt?: Date;
}
