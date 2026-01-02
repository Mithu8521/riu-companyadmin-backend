import { Controller, Post, Get, Param, Query, UploadedFile, UseInterceptors, Req, UseGuards } from '@nestjs/common';
import { VerifyTokenGuard } from '@utils/guards/verify-token/verify-token.guards';
import { ApiBearerAuth, ApiBody, ApiHeader, ApiOperation, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesManagerService } from './files-manager.service';
import { FileMetadataDTO } from './dto/file-metadata.dto';

@UseGuards(VerifyTokenGuard)
@Controller('v1.0')
@ApiTags('Files Manager')
export class FilesManagerController {
  constructor(private readonly filesManagerService: FilesManagerService) {}

  @Post('auth/uploadFile')
  @ApiOperation({ summary: 'Upload File' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File to upload',
        },
        userId: {
          type: 'string',
          description: 'ID of the user uploading the file',
        },
      },
      required: ['file', 'userId'],
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@Req() req, @UploadedFile() file: Express.Multer.File): Promise<{ message: string; data: FileMetadataDTO; isExisting?: boolean }> {
    return this.filesManagerService.uploadFile(req, file);
  }

  @Get('file-metadata/:uuid')
  @ApiOperation({ summary: 'Get File Metadata by UUID' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  async getFileByUuid(@Param('uuid') uuid: string): Promise<FileMetadataDTO | null> {
    return this.filesManagerService.getFileMetadata(uuid);
  }
}