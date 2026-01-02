import { LocationEntity } from '@modules/setting/source/entities/source.entity';
import { SubLocationEntity } from '@modules/setting/source/entities/sub-location.entity';
import { CompanyEntity } from '@modules/setting/user/entities/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';


@Entity('riu_intensity')
@Unique('UQ_intensity_combination', [
  'financialYearId',
  'questionId',
  'sourceId',
  'subLocationId',
  'fromDate',
  'toDate',
])
export class IntensityEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    userId: number;

    @Column()
    financialYearId: number;

    @Column()
    questionId: number;

    @Column({ nullable: true })
    sourceId: number | null;

    @Column({ nullable: true })
    subLocationId: number | null;

    @Column()
    fromDate: string;

    @Column()
    toDate: string;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    answer: number;

    @Column({ type: 'tinyint', width: 1, default: 1 })
    status: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(() => CompanyEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: CompanyEntity;

    @ManyToOne(() => LocationEntity, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'source_id' })
    source: LocationEntity;

    @ManyToOne(() => SubLocationEntity, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'sub_location_id' })
    subLocation: SubLocationEntity; 
}
