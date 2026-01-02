import { LocationEntity } from '@modules/setting/source/entities/source.entity';
import { SubLocationEntity } from '@modules/setting/source/entities/sub-location.entity';
import { CompanyEntity } from '@modules/setting/user/entities/user.entity';
import { GHGScope } from '@utils/enums/Status';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Check,
  ManyToOne,
  JoinColumn
} from 'typeorm';

@Entity('riu_scope_emissions')
@Check('chk_riu_scope_emissions_date_range', '"from_date" <= "to_date"')
export class EmissionScopeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  financialYearId: number;

  @Column({
    type: 'enum',
    enum: GHGScope,
  })
  ghgScope: GHGScope;

  @Column()
  ghgDatabaseId: number;

  @Column({ nullable: true })
  questionId: number | null;

  @Column()
  sourceId: number;

  @Column({ nullable: true })
  subLocationId: number | null;

  @Column({ type: 'json', nullable: true })
  inputDetails: any;  

  @Column({ type: 'varchar', length: 7 })
  fromDate: string;

  @Column({ type: 'varchar', length: 7 })
  toDate: string;

  @Column({ type: 'tinyint', width: 1, default: 1 })
  status: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => CompanyEntity, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'user_id' })
  user: CompanyEntity;

  @ManyToOne(() => LocationEntity, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'source_id' })
  source: LocationEntity;

  @ManyToOne(() => SubLocationEntity, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'sub_location_id' })
  subLocation: SubLocationEntity;

  constructor(
    userId: number,
    financialYearId: number,
    ghgScope:GHGScope,
    ghgDatabaseId: number,
    questionId: number | null = null,
    inputDetails: any,
    fromDate: string,
    toDate: string,
    sourceId: number = 1,
    subLocationId?: number,
    status: boolean = true
  ) {
    this.userId = userId;
    this.financialYearId = financialYearId;
    this.ghgScope=ghgScope,
    this.ghgDatabaseId = ghgDatabaseId;
    this.questionId = questionId;
    this.inputDetails = inputDetails;
    this.fromDate = fromDate;
    this.toDate = toDate;
    this.sourceId = sourceId;
    this.subLocationId = subLocationId || null;
    this.status = status;
  }
}
