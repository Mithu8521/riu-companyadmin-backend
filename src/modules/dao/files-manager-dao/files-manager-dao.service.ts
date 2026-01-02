import { FileMetadataEntity } from "@app/modules/files-manager/entities/file-metdata.entity";
import { Injectable } from "@nestjs/common";
import { DataSource, Repository, Between, FindOptionsWhere, ILike, EntityManager } from "typeorm";

@Injectable()
export class FilesManagerDaoService {
  private readonly repo: Repository<FileMetadataEntity>;

  constructor(private dataSource: DataSource) { 
    this.repo = dataSource.getRepository(FileMetadataEntity);
  }

  async createFileMetadata(entity: FileMetadataEntity): Promise<FileMetadataEntity> {
    return this.repo.save(entity);
  }

  async updateFileMetadata(entity: FileMetadataEntity, manager?: EntityManager): Promise<FileMetadataEntity> {
    if (manager) {
      return manager.getRepository(FileMetadataEntity).save(entity);
    }
    return this.repo.save(entity);
  }

  async getFileMetadata(uuid: string): Promise<FileMetadataEntity | null> {
    return this.repo.findOne({ where: { uuid } });
  }

  async getFileMetadataByHash(hash: string): Promise<FileMetadataEntity | null> {
    return this.repo.findOne({ where: { hash } });
  }
}