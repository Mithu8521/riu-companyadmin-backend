import {
  Entity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { FileMetadataEntity } from '@app/modules/files-manager/entities/file-metdata.entity';
import { CompanyEntity } from '@app/modules/setting/user/entities/user.entity';
import { createHash } from 'crypto';

// Enum definitions for stronger type safety
export enum DocumentType {
  BILL = 'BILL',
  OTHERS = 'OTHERS',
}

interface ReportingQuestionMeta {
  questionId: number;
  row?: number;
  readingColumn?: number;
  readingValue?: string | number;
  readingUnit?: string;
  addReadings?: boolean;
  operationType?: 'SUM' | 'REPLACE';
}

export enum ReportingCategory {
  ENVIRONMENT = 'Environment',
  SOCIAL = 'Social',
  GOVERNANCE = 'Governance',
}

// Optional: Define metadata interfaces for clarity
export interface BillMetadata {
  documentSubType: string;
  name?: string;
  billingStartDate: string;
  billingEndDate: string;
  billingMonth: string;
  actualUnit: string,
  actualUnitsConsumed: string,
  unit: string;
  unitsConsumed: number;
}

export interface OthersMetadata {
  documentType: string
}

// Transformer to serialize ReportingQuestion into a stable string key
export const ReportingQuestionMetaTransformer = {
  to: (value: ReportingQuestionMeta | null): string | null => {
    if (!value) return null;
    // deterministic serialization

    if (value.questionId != null && value.row != null) {
      return `Q${value.questionId}R${value.row+1}`;
    } else if (value.questionId != null) {
      return `Q${value.questionId}`;
    }

    return null;
  },
  toDocumentKpiKey: (value: ReportingQuestionMeta | null): string | null => {
    if (!value) return null;
    // deterministic serialization

    if (value.questionId != null && value.row != null && value.readingColumn != null) {
      return `Q${value.questionId}R${value.row+1}C${value.readingColumn+1}`;
    } else if (value.questionId != null && value.row != null) {
      return `Q${value.questionId}R${value.row+1}`;
    } else if (value.questionId != null) {
      return `Q${value.questionId}`;
    }

    return null;
  },
  from: (value: string | null): string | null => value,
};


@Entity('riu_documents')
@Unique('uq_document_identity_key', ['documentIdentityKey'])
export class DocumentEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: DocumentType,
    comment: 'Type of document',
  })
  documentType: DocumentType;

  @Column({nullable: true})
  financialYearId: number;

  @Column({nullable: true})
  sourceId: number;

  @Column({ nullable: true })
  subLocationId: number;

  @Column({ length: 30, nullable: true})
  frequency: string;

  @Column({ length: 20, nullable: true })
  fromDate: string;

  @Column({ length: 20, nullable: true })
  toDate: string;

  @Column({ length: 100, nullable: true })
  moduleName: string;

  // Consider storing this as JSONB (Postgres) if available
  @Column({ type: 'json' })
  documentMetadata: BillMetadata | OthersMetadata;

  @Column({ name: 'file_metadata_id' })
  fileMetadataId: string;

  @ManyToOne(() => FileMetadataEntity, { nullable: false, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'file_metadata_id' })
  fileMetadata: FileMetadataEntity;

  @Column({
    type: 'varchar',
    length: 20,
    transformer: ReportingQuestionMetaTransformer,
    nullable: true,
  })
  reportingQuestionMetaKey: string | null;

  @Column({ type: 'boolean', default: false})
  addToReporting: boolean;

  @Column({ type: 'json', nullable: true })
  reportingQuestionMeta: ReportingQuestionMeta;

  @Column({ name: 'created_by' })
  createdById: number;

  @ManyToOne(() => CompanyEntity, { nullable: false, onDelete: 'NO ACTION' })
  @JoinColumn({name: 'created_by'})
  createdBy: CompanyEntity;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @Column({ name: 'updated_by' })
  updatedById: number;

  @ManyToOne(() => CompanyEntity, { nullable: false, onDelete: 'NO ACTION' })
  @JoinColumn({name: 'updated_by'})
  updatedBy: CompanyEntity;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt: Date;

  @Column({ type: 'varchar', length: 255, nullable: false })
  documentIdentityKey: string;

  // Lifecycle hook (before insert/update)
  @BeforeInsert()
  @BeforeUpdate()
  generateIdentityKey() {
    // Normalize nulls to something fixed
    const fy = this.financialYearId ?? 'NULL';
    const source = this.sourceId ?? 'NULL';
    const subLoc = this.subLocationId ?? 'NULL';
    const from = this.fromDate ?? 'NULL';
    const to = this.toDate ?? 'NULL';
    const file = this.fileMetadataId ?? 'NULL';
    const rq = this.reportingQuestionMetaKey ?? 'NULL';

    if (typeof rq !== 'string') {
      throw new Error('reportingQuestionMetaKey must be string');
    }

    const rawKey = `${fy}_${source}_${subLoc}_${from}_${to}_${file}_${rq}`;
    this.documentIdentityKey = createHash("sha256").update(rawKey).digest("hex");
  }
}
