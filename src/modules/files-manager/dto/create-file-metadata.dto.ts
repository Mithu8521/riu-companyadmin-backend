import { IsString, IsEnum, IsNumber, IsOptional, IsUUID, IsIn, IsNotEmpty, IsBoolean } from 'class-validator';
import { StorageProvider } from '../entities/file-metdata.entity';
import { Type } from 'class-transformer';


export class CreateFileMetadataDto {
  @IsString()
  @IsNotEmpty()
  hash: string;

  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsString()
  @IsNotEmpty()
  mimeType: string;

  @IsNumber()
  fileSize: number;

  @IsEnum(StorageProvider)
  provider: StorageProvider;

  @IsString()
  @IsNotEmpty()
  url: string;

  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  uploadedById: number;

  @IsOptional()
  @IsBoolean()
  isTemporary?: boolean;
}