import { BadRequestException } from '@nestjs/common';
import { bool } from 'aws-sdk/clients/signer';
import { IsEmail, ValidateIf } from 'class-validator';
import { Entity, PrimaryGeneratedColumn, CreateDateColumn, Column, UpdateDateColumn, BeforeInsert, BeforeUpdate } from 'typeorm';

@Entity('riu_sub_user_master')
export class SubUserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  @ValidateIf((obj) => obj.emailId !== null && obj.emailId !== undefined && obj.emailId.trim() !== '')
  @IsEmail({}, { message: 'Invalid email format' })
  emailId?: string;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  employeeId?: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  mobileNumber: string;

  @Column()
  invitedBy: number;

  @Column()
  companyId: number;

  @Column()
  parentId: number;

  @Column()
  designationId: number;

  @Column()
  sourceId: string;

  @Column()
  roleId: number;

  @Column()
  twoFaStatus: boolean;

  @Column()
  status: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  @BeforeUpdate()
  checkEmailOrEmployeeId() {
    // Normalize: convert empty strings to null
    this.emailId = this.emailId?.trim() || null;
    this.employeeId = this.employeeId?.trim() || null;

    if (!this.emailId && !this.employeeId) {
      throw new BadRequestException(
        'Either emailId or employeeId must be provided.'
      );
    }
  }

  constructor(emailId: string, employeeId: string, firstName: string, lastName: string, mobileNumber: string, invitedBy: number, companyId: number, parentId: number, designationId: number, sourceId: string, roleId: number, twoFaStatus: boolean, status: boolean) {   
    this.emailId = emailId;
    this.employeeId = employeeId;
    this.firstName = firstName;
    this.lastName = lastName;
    this.mobileNumber = mobileNumber;
    this.invitedBy = invitedBy;
    this.companyId = companyId;
    this.parentId = parentId;
    this.designationId = designationId;
    this.sourceId = sourceId;
    this.roleId = roleId;
    this.status = status;
    this.twoFaStatus = twoFaStatus;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}
