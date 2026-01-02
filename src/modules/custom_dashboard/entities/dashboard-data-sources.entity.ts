// src/entities/data-source.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';

import { MeasurementType } from '@app/modules/iot-meters/enums/measurement-type.enum';
import { DataSourceType } from '../enums/data-source-type.enum';

@Entity('riu_dashboard_data_sources')
export class DashboardDataSource {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: DataSourceType,
    default: DataSourceType.REPORTING,
  })
  type: DataSourceType;

  @Column({
    type: 'enum',
    enum: MeasurementType,
    default: MeasurementType.INTERVAL,
  })
  measurementType: MeasurementType;


  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}