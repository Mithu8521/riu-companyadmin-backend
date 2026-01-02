import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('riu_trainee_user')
export class TraineeUser {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ type: 'varchar', length: 250, charset: 'utf8mb4', collation: 'utf8mb4_0900_ai_ci' })
  emailId: string;

  @Column({ type: 'varchar', length: 250, charset: 'utf8mb4', collation: 'utf8mb4_0900_ai_ci' })
  firstName: string;

  @Column({ type: 'varchar', length: 250, charset: 'utf8mb4', collation: 'utf8mb4_0900_ai_ci', nullable: true })
  lastName?: string;

  @Column({ type: 'varchar', length: 250, charset: 'utf8mb4', collation: 'utf8mb4_0900_ai_ci' })
  mobileNumber: string;

  @Column({ type: 'varchar', length: 250, charset: 'utf8mb4', collation: 'utf8mb4_0900_ai_ci' })
  companyName: string;

  @Column({ type: 'varchar', length: 250, charset: 'utf8mb4', collation: 'utf8mb4_0900_ai_ci' })
  employeeId: string;

  @Column({ type: 'varchar', length: 250, charset: 'utf8mb4', collation: 'utf8mb4_0900_ai_ci' })
  gender: string;

  @Column({ type: 'tinyint', width: 1, nullable: true })
  status?: boolean;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', nullable: true })
  updatedAt?: Date;

  constructor(
    emailId: string,
    firstName: string,
    mobileNumber: string,
    employeeId: string,
    gender: string,
    lastName?: string,
    companyName?: string,    
    status?: boolean
  ) {
    this.emailId = emailId;
    this.firstName = firstName;
    this.lastName = lastName;
    this.companyName = companyName;
    this.mobileNumber = mobileNumber;
    this.employeeId = employeeId;
    this.gender = gender;
    this.status = status;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}
