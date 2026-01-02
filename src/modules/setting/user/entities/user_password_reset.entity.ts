import { BadRequestException } from '@nestjs/common';
import { IsEmail, ValidateIf } from 'class-validator';
import { Entity, PrimaryGeneratedColumn, CreateDateColumn, Column, BeforeInsert, BeforeUpdate } from 'typeorm';

@Entity('riu_user_password_reset')
export class PasswordResetEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    token: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    @ValidateIf((obj) => obj.email !== null && obj.email !== undefined && obj.email.trim() !== '')
    @IsEmail({}, { message: 'Invalid email format' })
    email?: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    employeeId?: string;

    @Column()
    status: boolean;

    @CreateDateColumn()
    createdAt: Date;

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
        token: string,
        email: string,
        employeeId: string,
        status: boolean,
    ) {
        this.token = token;
        this.email = email;
        this.employeeId = employeeId;
        this.status = status;
        this.createdAt = new Date();
    }
}
