import { IsString, IsUUID, IsOptional } from 'class-validator';

export class GetFileMetadataDto {
  @IsOptional()
  @IsUUID()
  uuid?: string;

  @IsOptional()
  @IsString()
  hash?: string;
}
