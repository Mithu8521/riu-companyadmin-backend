import { BadRequestException } from '@nestjs/common';
import { IsEmail, ValidateIf } from 'class-validator';
import { Entity, PrimaryGeneratedColumn, CreateDateColumn, Column, UpdateDateColumn, BeforeInsert, BeforeUpdate } from 'typeorm';

@Entity('riu_users')
export class CompanyEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  head_office: boolean;

  @Column({ nullable: true })
  parent_id: number;

  @Column({ nullable: true })
  group_admin_id: number;

  @Column({ nullable: true })
  company_id: number;

  @Column({ nullable: true })
  user_type_code: string;

  @Column({ nullable: true })
  validate_answer: string;

  @Column({ nullable: true })
  active_auditor_id: number;

  @Column({ nullable: true })
  role_id: number;

  @Column({ nullable: true })
  register_company_name: string;

  @Column({
    type: 'enum',
    enum: ['TRAINEE', 'COMPANY_USER'],
    default: 'COMPANY_USER',
  })
  userType: 'TRAINEE' | 'COMPANY_USER';

  @Column({
    type: 'enum',
    enum: ['MALE', 'FEMALE', 'OTHER'],
    nullable: true,
  })
  gender?: 'MALE' | 'FEMALE' | 'OTHER';

  @Column({ type: 'varchar', nullable: true })
  categoryId?: string;

  @Column({ type: 'varchar', nullable: true })
  departmentId?: string;

  @Column({ nullable: true })
  first_name: string;

  @Column({ nullable: true })
  last_name: string;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  @ValidateIf((obj) => obj.email !== null && obj.email !== undefined && obj.email.trim() !== '')
  @IsEmail({}, { message: 'Invalid email format' })
  email?: string;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  employeeId?: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  password: string;

  @Column({ nullable: true })
  mobile_number: string;

  @Column({ nullable: true })
  profile_picture: string;

  @Column({ nullable: true })
  access_token: string;

  @Column({ nullable: true })
  otp: string;

  @Column({ type: 'datetime', nullable: true })
  otpExpiresAt: Date;

  @Column()
  twoFaStatus: boolean;

  @Column({ nullable: true })
  source_ids: string;

  @Column({ nullable: true })
  broker_commision: number;

  @Column()
  frequency: string;

  @Column({ nullable: true })
  starting_month: number;

  @Column({ nullable: true })
  device: string;

  @Column({ nullable: true })
  business_number: string;

  @Column({ nullable: true })
  company_industry_id: number;

  @Column({ nullable: true })
  company_industry: string;

  @Column({ nullable: true })
  position: string;

  @Column({ nullable: true })
  charge_type: string;

  @Column({ nullable: true })
  charge_value: number;

  @Column({ nullable: true })
  user_category: string;

  @Column({ nullable: true })
  businessUnit: string;

  @Column({ nullable: true })
  division: string;

  @Column()
  status: boolean;

  @Column({ type: 'date', nullable: true })
  lastWorkingDate?: Date;

  @Column({  nullable: true })
  joiningDate?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  @BeforeUpdate()
  checkEmailOrEmployeeId() {
    // Normalize: convert empty strings to null
    this.email = this.email?.trim() || null;
    this.employeeId = this.employeeId?.trim() || null;

    if (!this.email && !this.employeeId) {
      throw new BadRequestException(
        'Either email or employeeId must be provided.'
      );
    }
  }

  constructor(
    head_office: boolean,
    parent_id: number,
    group_admin_id: number,
    company_id: number,
    user_type_code: string,
    validate_answer: string,
    active_auditor_id: number,
    role_id: number,
    register_company_name: string,
    first_name: string,
    last_name: string,  
    email: string,
    employeeId: string,
    country: string,
    password: string,
    mobile_number: string,
    profile_picture: string,
    access_token: string,
    otp:string,
    otpExpiresAt: Date,
    twoFaStatus:boolean,
    source_ids: string,
    broker_commision: number,
    company_industry_id: number,
    frequency: string,
    starting_month: number,
    device: string,
    business_number: string,
    company_industry: string,
    position: string,
    charge_type: string,
    charge_value: number,
    user_category: string,
    status: boolean,
    userType: 'TRAINEE' | 'COMPANY_USER',
    gender?: 'MALE' | 'FEMALE' | 'OTHER',
    categoryId?: string,
    departmentId?: string,
    businessUnit?: string,
    division?: string,
    lastWorkingDate?: Date,
    joiningDate?: string,
  ) {
    this.head_office = head_office;
    this.company_id = company_id;
    this.parent_id = parent_id;
    this.group_admin_id = group_admin_id;
    this.user_type_code = user_type_code;
    this.user_category = user_category;
    this.source_ids = source_ids;
    this.validate_answer = validate_answer;
    this.active_auditor_id = active_auditor_id;
    this.role_id = role_id;
    this.broker_commision = broker_commision;
    this.register_company_name = register_company_name;
    this.profile_picture = profile_picture;
    this.first_name = first_name;
    this.last_name = last_name;
    this.mobile_number = mobile_number;
    this.country = country;
    this.email = email;
    this.employeeId = employeeId;
    this.password = password;
    this.access_token = access_token;
    this.otp = otp;
    this.otpExpiresAt = otpExpiresAt; 
    this.twoFaStatus = twoFaStatus; 
    this.device = device;
    this.business_number = business_number;
    this.company_industry = company_industry;
    this.company_industry_id = company_industry_id;
    this.position = position;
    this.starting_month = starting_month;
    this.frequency = frequency;
    this.charge_type = charge_type;
    this.charge_value = charge_value;
    this.status = status;
    this.employeeId = employeeId;
    this.gender = gender;
    this.categoryId = categoryId;
    this.departmentId = departmentId;
    this.businessUnit = businessUnit;
    this.division = division;
    this.userType = userType;
    this.lastWorkingDate = lastWorkingDate;
    this.joiningDate = joiningDate;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}