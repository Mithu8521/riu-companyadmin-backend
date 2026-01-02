import { Entity, PrimaryGeneratedColumn, CreateDateColumn, Column, UpdateDateColumn } from 'typeorm';
@Entity('riu_catagory_unit')
export class Unit {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  catagoryId: number;

  @Column()
  unit: string;

  @Column()
  isEditable: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  constructor(
    userId: number,
    catagoryId: number,
    unit: string,
    isEditable: boolean
  ) {
    this.userId = userId;
    this.catagoryId = catagoryId;   
    this.unit = unit;
    this.isEditable=isEditable;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}
