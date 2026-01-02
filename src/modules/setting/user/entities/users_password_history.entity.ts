import { BadRequestException } from '@nestjs/common';
import { IsEmail, ValidateIf } from 'class-validator';
import { Entity, PrimaryGeneratedColumn, CreateDateColumn, Column, UpdateDateColumn, BeforeInsert, BeforeUpdate } from 'typeorm';

@Entity('riu_users_password_history')
export class PasswordHistoryEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 255, nullable: true })
    @ValidateIf((obj) => obj.email !== null && obj.email !== undefined && obj.email.trim() !== '')
    @IsEmail({}, { message: 'Invalid email format' })
    email?: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    employeeId?: string;

    @Column()
    password: string;

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
        email: string,
        employeeId: string,
        password: string,
    ) {
        this.email = email;
        this.employeeId = employeeId;
        this.password = password;
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }
}
