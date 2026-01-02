import { Injectable } from '@nestjs/common';
import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import * as fs from 'fs/promises';
import {Express} from 'express';


@Injectable()
export class UploadFileService {
  private blobServiceClient: BlobServiceClient;
  private containerClient: ContainerClient;
 
  constructor() {
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
  async uploadFileToAzure(file: Express.Multer.File, keyPrefix: string): Promise<string> {
    try {
      if (!file || !file.path) {
        console.error('Invalid file or file path:', file);
        throw new Error('Invalid file or file path.');
      }
 
      const fileData = await fs.readFile(file.path);
      const blobName = `${keyPrefix}${file.originalname}`; 
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
 
      await blockBlobClient.upload(fileData, fileData.length, {
        blobHTTPHeaders: { blobContentType: file.mimetype },
      });
 
      await fs.unlink(file.path);
 
      return blockBlobClient.url;
    } catch (error) {
      console.error('Error uploading file to Azure:', error);
      throw new Error('Error uploading file.');
    }
  }
}