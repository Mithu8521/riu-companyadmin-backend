import { BadRequestException, HttpException, HttpStatus, Injectable, Req } from '@nestjs/common';
import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import * as crypto from 'crypto';
import { FilesManagerDaoService } from '@app/modules/dao/files-manager-dao/files-manager-dao.service';
import { CreateFileMetadataDto } from './dto/create-file-metadata.dto';
import { FileMetadataDTO } from './dto/file-metadata.dto';
import { plainToInstance } from 'class-transformer';
import { FileMetadataEntity, StorageProvider } from './entities/file-metdata.entity';
import { EntityManager } from 'typeorm';

@Injectable()
export class FilesManagerService {
  private blobServiceClient: BlobServiceClient;
  private containerClient: ContainerClient;

  constructor(
    private readonly filesManagerDaoService: FilesManagerDaoService
  ) {
    const azureStorageConnectionString = `DefaultEndpointsProtocol=https;AccountName=copyadatafromawstoazure;AccountKey=Rm0FDmsdlyzLLtEeaJZ2euskxk3dD0KcZqLyUVf5J5RH8CfyGNaL+xhkuLPt/YaYH6kqyVc7YYne+AStRYr2eg==;EndpointSuffix=core.windows.net`;
    const containerName = 'uploads';

    this.blobServiceClient = BlobServiceClient.fromConnectionString(azureStorageConnectionString);
    this.containerClient = this.blobServiceClient.getContainerClient(containerName);

    this.containerClient.createIfNotExists({ access: 'blob' }).then(() => {
      console.log(`Container '${containerName}' is ready.`);
    }).catch((err) => {
      console.error('Error creating container:', err);
    });
  }

  async uploadFile(@Req() req, file: Express.Multer.File): Promise<{ message: string; data: FileMetadataDTO; isExisting?: boolean }> {
    try {
      if (!file) {
        throw new BadRequestException('No file uploaded');
      }
      // Calculate file hash first
      const hash = crypto.createHash('sha256').update(file.buffer).digest('hex');
      
      // Check if file with the same hash already exists
      const existingFileMetadataEntity = await this.filesManagerDaoService.getFileMetadataByHash(hash);
      const existingFileMetadataDTO = existingFileMetadataEntity ? plainToInstance(FileMetadataDTO, existingFileMetadataEntity) : null;

      if (existingFileMetadataDTO) {
        // File already exists, return existing metadata
        return { 
          message: 'File already exists in the system.', 
          data: existingFileMetadataDTO,
          isExisting: true
        };
      }
      
      // File doesn't exist, proceed with upload
      const key = '';
      const url = await this.uploadFileToAzure(file, key);
  
      const metadata: CreateFileMetadataDto = {
        hash,
        fileName: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        provider: StorageProvider.AZURE,
        url,
        uploadedById: req.headers.userid,
        isTemporary: req.body?.isTemporary === 'true'
      };

      const savedMetadata = await this.createFileMetadata(metadata);
  
      return { message: 'File uploaded successfully.', data: savedMetadata };
    } catch (error) {
      console.error(error);
      throw new Error('Error uploading file.');
    }
  }

  async createFileMetadata(dto: CreateFileMetadataDto): Promise<FileMetadataDTO> {
    const entity = new FileMetadataEntity();
    Object.assign(entity, dto);

    const savedEntity = await this.filesManagerDaoService.createFileMetadata(entity);
    return plainToInstance(FileMetadataDTO, savedEntity);
  }

  async updateFileMetadata(uuid: string, dto: Partial<CreateFileMetadataDto>, manager?: EntityManager): Promise<FileMetadataDTO> {
    const existing = await this.filesManagerDaoService.getFileMetadata(uuid);
    if (!existing) {
      throw new HttpException(`File metadata with hash ${uuid} not found`, HttpStatus.NOT_FOUND);
    }

    Object.assign(existing, dto);

    const updatedEntity = await this.filesManagerDaoService.updateFileMetadata(existing, manager);

    return plainToInstance(FileMetadataDTO, updatedEntity);
  }


  async getFileMetadata(uuid: string): Promise<FileMetadataDTO | null> {
    const entity = await this.filesManagerDaoService.getFileMetadata(uuid);
    return entity ? plainToInstance(FileMetadataDTO, entity) : null;
  }

  async getFileMetadataByHash(hash: string): Promise<FileMetadataDTO | null> {
    const entity = await this.filesManagerDaoService.getFileMetadataByHash(hash);
    return entity ? plainToInstance(FileMetadataDTO, entity) : null;
  }

  private async uploadFileToAzure(file: Express.Multer.File, keyPrefix: string): Promise<string> {
    try {
      if (!file || !file.buffer) {
        console.error('Invalid file or file path:', file);
        throw new Error('Invalid file or file path.');
      }

      keyPrefix = keyPrefix || '';
      const epochMillis = Date.now(); // epoch in milliseconds
      // format: myPrefix/epochMillis/
      keyPrefix = `${keyPrefix ? keyPrefix + '/' : ''}${epochMillis}/`;
      if (keyPrefix.length > 0 && !keyPrefix.endsWith('/')) {
        keyPrefix += '/';
      }
      const blobName = `${keyPrefix}${file.originalname}`; 
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      console.log(`Uploading to blob: ${blobName}`);

      await blockBlobClient.upload(file.buffer, file.size, {
        blobHTTPHeaders: { blobContentType: file.mimetype },
      });

      return blockBlobClient.url;
    } catch (error) {
      console.error('Error uploading file to Azure:', error);
      throw new Error('Error uploading file.');
    }
  }

}