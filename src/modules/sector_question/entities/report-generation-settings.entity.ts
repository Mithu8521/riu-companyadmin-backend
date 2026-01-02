import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Unique } from 'typeorm';

@Entity({ name: 'riu_report_generation_settings' })
@Unique(['financialYearId', 'frameworkId', 'settingName'])
export class ReportGenerationSettingEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'financial_year_id', type: 'int' })
  financialYearId: number;

  @Column({ name: 'framework_id', type: 'int' })
  frameworkId: number;

  @Column({ name: 'setting_name', type: 'varchar', length: 255 })
  settingName: string;

  @Column({ name: 'setting_meta_and_answer', type: 'json' }) // MySQL supports json type
  settingMetaAndAnswer: {};

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
