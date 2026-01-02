import { ES } from "aws-sdk";
import { Expose, Transform } from "class-transformer";

export class FileMetadataDTO {
  @Expose() hash: string;
  
  @Expose() uuid: string;

  @Expose()
  uploadedById: number;

  @Expose() fileName: string;
  
  @Expose() mimeType: string;
  
  @Expose() fileSize: number;
  
  @Expose() provider: string;
  
  @Expose() url: string;

  @Expose() isTemporary: boolean;
  
  @Expose() createdAt: Date;
  
  @Expose() deletedAt: Date | null;
}