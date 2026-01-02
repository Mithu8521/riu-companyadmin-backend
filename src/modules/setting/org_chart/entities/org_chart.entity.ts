export class OrgChart {}
import { Entity, PrimaryGeneratedColumn, CreateDateColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('riu_org_chart')
export class OrgChartEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  orgChart: string;

  @Column()
  userId: number;

  @Column()
  createdBy: number;

  @Column()
  updatedBy: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
  
  constructor(  
    orgChart: string,
    createdBy: number,
    updatedBy: number,
    userId: number 
  ) {
    this.orgChart = orgChart;
    this.createdBy = createdBy;
    this.userId = userId;
    this.updatedBy = updatedBy;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}
