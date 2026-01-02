import { Entity, PrimaryGeneratedColumn, CreateDateColumn, Column, UpdateDateColumn } from 'typeorm';
@Entity('riu_process')
export class ProcessEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  process: string;

  @Column()
  created_by: number;

  @Column()
  is_deletable: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  constructor(process: string, created_by: number, is_deletable: boolean) {
    this.process = process;
    this.created_by = created_by;
    this.is_deletable = is_deletable;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}
