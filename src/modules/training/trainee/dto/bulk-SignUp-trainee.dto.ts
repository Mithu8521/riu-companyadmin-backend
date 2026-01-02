import { ApiProperty } from "@nestjs/swagger";
import { AtLeastOneOf } from "@utils/common/validators/at-least-one-of.validator";
import { Gender, UserType } from "@utils/enums/Status";
import { Type, Transform } from "class-transformer";
import { IsArray, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, ValidateIf, ValidateNested, IsDateString } from "class-validator";

@AtLeastOneOf(['email', 'employeeId'], {
  message: 'Either email or employeeId must be provided.',
})
class TraineeDto {
    @ApiProperty({required: false})
    @IsString()
    @IsOptional()
    @Transform(({ value }) => value?.trim().toLowerCase())
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
    firstName: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    lastName: string;

    @ApiProperty({ enum: Gender })
    @IsNotEmpty()
    @IsEnum(Gender)
    gender: Gender;

    @ApiProperty({ required: false })
    @IsOptional()
    categoryId?: any;

    @ApiProperty()
    @IsNotEmpty()
    departmentId: any;

    @ApiProperty()
    @IsOptional()
    companyName: any;

    @ApiProperty()
    @IsOptional()
    businessUnit: any;

    @ApiProperty()
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

// DTO for bulk signup request
export class BulkSignUpTraineeDto {
    @ApiProperty({ type: [TraineeDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => TraineeDto)
    trainees: TraineeDto[];

    @ApiProperty({ enum: UserType })
    @IsNotEmpty()
    @IsEnum(UserType)
    userType: UserType;
}