import {
    Entity,
    Column,
    PrimaryColumn,
    CreateDateColumn,
    DeleteDateColumn,
    Index,
    BeforeInsert,
    ManyToOne,
    JoinColumn,
  } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { CompanyEntity } from '@modules/setting/user/entities/user.entity';


export enum StorageProvider {
  AWS = 'AWS',
  AZURE = 'AZURE',
  LOCAL = 'LOCAL',
  GCP = 'GCP'
}



@Entity('riu_files_metadata')
export class FileMetadataEntity {
    @PrimaryColumn({ length: 36 })
    uuid: string;

    @Column({ length: 64, unique: true })
    hash: string;

    @Column({ length: 510 })
    fileName: string;

    @Column({ length: 100 })
    mimeType: string;

    @Column({ type: 'bigint' })
    fileSize: number;

    @Column({
        type: 'enum',
        enum: ['AWS', 'AZURE', 'LOCAL', 'GCP'],
        comment: 'Storage provider for the file',
    })
    provider: StorageProvider;

    @Column({ type: 'text' })
    url: string;

    @Column({ name: 'uploaded_by' })
    uploadedById: number;

    @ManyToOne(() => CompanyEntity, { nullable: false, onDelete: 'NO ACTION' })
    @JoinColumn({name: 'uploaded_by'})
    uploadedBy: CompanyEntity;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    @DeleteDateColumn({ type: 'timestamp', nullable: true })
    deletedAt: Date;

    @Column({ type: 'boolean', default: false })
    isTemporary: boolean;

    @BeforeInsert()
    generateUuid() {
        if (!this.uuid) {
        this.uuid = uuidv4();
        }
    }
}
