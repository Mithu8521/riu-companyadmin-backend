export class Source {}
import { Entity, PrimaryGeneratedColumn, CreateDateColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('riu_designation_master')
export class DesignationEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  designation: string;

  @Column()
  created_by: number;

  @Column()
  is_deletable: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
  
  constructor(designation: string, created_by: number, is_deletable: boolean) {
    this.designation = designation;
    this.created_by = created_by;
    this.is_deletable = is_deletable;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}
