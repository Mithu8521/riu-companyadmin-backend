import { Entity, PrimaryGeneratedColumn, CreateDateColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('riu_role_master')
export class RoleMasterEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  role_name: string;

  @Column()
  created_by: number;

  @Column()
  assigned_to: string;

  @Column()
  system_created: boolean 

  @Column()
  onlyauditor: boolean 
  
  @Column()
  is_deletable: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  constructor(role_name: string,   created_by: number,  assigned_to: string , system_created: boolean , onlyauditor: boolean , is_deletable: boolean) {
    this.role_name = role_name;
    this.created_by = created_by;
    this.assigned_to = assigned_to;
    this.system_created = system_created;
    this.onlyauditor = onlyauditor;
    this.is_deletable = is_deletable;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}
