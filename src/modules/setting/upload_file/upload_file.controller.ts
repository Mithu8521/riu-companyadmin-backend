import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { UploadFileService } from './upload_file.service';
import { Expr } from 'aws-sdk/clients/cloudsearchdomain';

import { ApiTags } from '@nestjs/swagger';
 
@ApiTags('File Upload Module')
@Controller('v1.0')
export class UploadFileController {
  constructor(private readonly uploadFileService: UploadFileService) {}
 
  @Post('auth/uploadFile')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File): Promise<{ message: string; url: string }> {
    try {
      const key = `uploads/${file.originalname}`;
      const url = await this.uploadFileService.uploadFileToAzure(file, key);
 
      return { message: 'File uploaded successfully.', url };
    } catch (error) {
      console.error(error);
      throw new Error('Error uploading file.');
    }
  }
}