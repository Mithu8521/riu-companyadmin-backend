import { Injectable } from '@nestjs/common';
import { Between, DataSource, DeleteResult, EntityManager, Repository } from "typeorm";
import { DocumentEntity } from '@modules/documents/entities/document.entity';
import { DocumentDto } from '@modules/documents/dto/document.dto';
import { plainToInstance } from 'class-transformer';
import { ListDocumentsDto } from '@app/modules/documents/dto/list-documents.dto';


@Injectable()
export class DocumentsDaoService {

    private readonly repo: Repository<DocumentEntity>;

    constructor(private dataSource: DataSource) { 
        this.repo = dataSource.getRepository(DocumentEntity);
    }

    async saveDocument(entity: DocumentEntity, userId: number, manager?: EntityManager): Promise<DocumentEntity> {
        const now = new Date();

        if (!entity.id) {
            // New document → set createdBy & updatedBy
            entity.createdById = userId;
            entity.updatedById = userId;
        } else {
            // Existing document → update updatedBy
            entity.updatedById = userId;
        }

        if (manager) {
            return manager.getRepository(DocumentEntity).save(entity);
        }

        return this.repo.save(entity);
    }


    async getDocument(id: number): Promise<DocumentEntity | null> {
        return this.repo.findOne({ 
            where: { id },
            relations: ['fileMetadata',],
        });
    }

    async getDocumentByIdentityKey(documentIdentityKey: string): Promise<DocumentEntity | null> {
        return this.repo.findOne({ 
            where: {   
                documentIdentityKey
            },
            relations: ['fileMetadata',],
        });
    }

    async listDocuments(): Promise<DocumentEntity[]> {
        return this.repo.find({
            relations: ['fileMetadata', 'createdBy'],
            order: {
                updatedAt: 'DESC',
            },
        });
    }

    async deleteDocument(documentId: number): Promise<DeleteResult> {
        return this.repo.delete({ id: documentId });
    }
}
