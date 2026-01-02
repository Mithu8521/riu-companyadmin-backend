import { ApiProperty } from '@nestjs/swagger';
import { AtLeastOneOf } from '@utils/common/validators/at-least-one-of.validator';
import { Gender, UserType } from '@utils/enums/Status';
import { IsNotEmpty, IsNumber, IsString, IsEnum, IsOptional, ValidateIf, IsEmail, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';

@AtLeastOneOf(['email', 'employeeId'], {
  message: 'Either email or employeeId must be provided.',
})
export class SignUpTraineeDto {
    @ApiProperty({required: false})
    @IsString()
    @IsOptional()
    @ValidateIf((obj) => obj.email !== null && obj.email !== undefined && obj.email.trim() !== '')
    @IsEmail({}, { message: 'Invalid email format' })
    email?: string;

    @ApiProperty({required: false})
    @IsString()
    @IsOptional()
    employeeId?: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    password: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    firstName: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    token: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    lastName: string;

    @ApiProperty({ enum: UserType })
    @IsNotEmpty()
    @IsEnum(UserType)
    userType: UserType;

    @ApiProperty({ enum: Gender })
    @IsNotEmpty()
    @IsEnum(Gender)
    gender: Gender;

    @ApiProperty({ required: false }) // Marks it as optional in API documentation
    @IsOptional() // Allows it to be omitted
    // @IsNumber() // Ensures it's a number if provided
    categoryId?: any;    

    @ApiProperty()
    @IsNotEmpty()
    // @IsNumber()
    departmentId: any;

    @ApiProperty()
    @IsNotEmpty()
    // @IsNumber()
    companyName: any;

    @ApiProperty({ required: false })
    @IsOptional()
    businessUnit: any;

    @ApiProperty({ required: false }) 
    @IsOptional()
    division: any;

    @ApiProperty({ 
        description: 'Joining date in YYYY-MM-DD format',
        example: '2024-01-15',
        required: false
    })
    @IsOptional()
    @IsDateString({}, { message: 'Joining date must be a valid date in YYYY-MM-DD format' })
    @Transform(({ value }) => {
        // Handle null, undefined, or empty string
        if (!value || value === '') return null;
        
        // If it's already a valid date string, return it
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
            return value;
        }
        
        // If it's a Date object, convert to YYYY-MM-DD string
        if (value instanceof Date) {
            return value.toISOString().split('T')[0];
        }
        
        // Try to parse and format the date
        try {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
                return date.toISOString().split('T')[0];
            }
        } catch (error) {
            // Return original value to let validation handle the error
            return value;
        }
        
        return value;
    })
    joiningDate?: string;
}