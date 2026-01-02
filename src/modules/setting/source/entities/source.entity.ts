import { Entity, PrimaryGeneratedColumn, CreateDateColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('riu_source')
export class LocationEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  location: string;

  @Column()
  unitCode: string;

  @Column()
  created_by: number;

  @Column()
  head_Office: boolean;

  @Column({ nullable: true })
  assigned_user_id: string

  @Column()
  is_deletable: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
  constructor(location: string, unitCode: string, created_by: number, head_Office: boolean, assigned_user_id: string, is_deletable: boolean) {
    this.location = location;
    this.unitCode = unitCode;
    this.created_by = created_by;
    this.head_Office = head_Office;
    this.assigned_user_id = assigned_user_id;
    this.is_deletable = is_deletable;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}
