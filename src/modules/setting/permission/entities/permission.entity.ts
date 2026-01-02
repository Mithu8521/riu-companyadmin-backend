import { Entity, PrimaryGeneratedColumn, CreateDateColumn, Column, UpdateDateColumn } from 'typeorm';
@Entity('riu_permission_master')
export class PermissionMasterEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  role_id: number;

  @Column()
  sequence_id: number;

  @Column()
  permission: string;

  @Column()
  created_by: number;

  @Column()
  is_deletable: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  constructor(role_id: number, sequence_id: number, permission: string, created_by: number, is_deletable: boolean) {
    this.role_id = role_id;
    this.sequence_id = sequence_id;
    this.permission = permission;
    this.created_by = created_by;
    this.is_deletable = is_deletable;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}
