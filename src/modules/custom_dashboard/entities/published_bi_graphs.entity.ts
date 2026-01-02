import { Entity, PrimaryGeneratedColumn, CreateDateColumn, Column, UpdateDateColumn, Index } from 'typeorm';
import { DataSourceType } from '../enums/data-source-type.enum';

@Entity('riu_published_custom_graphs')
export class PublishedCustomGraphEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'user_id', type: 'bigint' })
  userId: number;

  @Column({
    type: 'enum',
    enum: DataSourceType,
    default: DataSourceType.REPORTING,
  })
  dataSourceType: DataSourceType;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'widget_config', type: 'json' })
  widgetConfig: WidgetConfig;

  @Column({ name: 'chart_type', type: 'varchar', length: 50 })
  chartType: string;

  @Column({ name: 'category', type: 'varchar', length: 50 })
  category: string;

  @Column({ name: 'x_axis_field', type: 'varchar', length: 100, nullable: true })
  xAxisField: string | null;

  @Column({ name: 'stack_by_field', type: 'varchar', length: 100, nullable: true })
  stackByField: string | null;

  @Column({ name: 'display_order', type: 'int', default: 0 })
  displayOrder: number;

  @Column({ name: 'refresh_interval', type: 'int', nullable: true })
  refreshInterval: number | null;

  @Column({ name: 'is_active', type: 'tinyint', default: 1 })
  isActive: number;

  @Column({ name: 'last_synced_at', type: 'datetime', nullable: true })
  lastSyncedAt: Date | null;

  @Column({ name: 'published', type: 'tinyint', default: 0 })
  published: number;

  @Column({ name: 'publish_date', type: 'datetime', nullable: true })
  publishDate: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

export interface WidgetConfig {
  module: string[];
  filters: {
    financial_year: string[];
    location_id: string[];
    category: string[];
    sub_category: string[];
    kpi: string[];
    displayPeriods: string[];
    startDateTime: Date;                // or string (ISO)
    endDateTime: Date;                  // or string (ISO)
    aggregationPeriodValue: number;     // e.g. 5, 15, 1
    aggregationPeriodUnit: AGGREGATION_PERIOD_ENUM;
  };
  group_by: string[];
  aggregate: {
    [key: string]: string | string[];
  };
  sort?: {
    field: string;
    order: 'asc' | 'desc';
  };
  limit?: number;
}

export enum AGGREGATION_PERIOD_ENUM {
  MINUTES = 'minutes',
  HOURS = 'hours',
  DAYS = 'days',
  MONTHS = 'months'
}
