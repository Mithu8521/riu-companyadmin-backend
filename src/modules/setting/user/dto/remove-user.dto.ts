import { ApiProperty } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsString,
  IsArray,
  ValidateNested,
  IsDateString,
  IsOptional,
  IsEmail,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UserRemovalDto {
  @ApiProperty({
    description: 'Employee ID of the user to be removed (required if email is not provided)',
    example: '10010580',
    required: false
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @ValidateIf(o => !o.email)
  employeeId?: string;

  @ApiProperty({
    description: 'Email of the user to be removed (required if employeeId is not provided)',
    example: 'john.doe@company.com',
    required: false
  })
  @IsOptional()
  @IsEmail({}, { message: 'Email must be a valid email address' })
  @ValidateIf(o => !o.employeeId)
  email?: string;

  @ApiProperty({
    description: 'Last working date in YYYY-MM-DD format',
    example: '2024-05-31'
  })
  @IsString()
  @IsNotEmpty()
  @IsDateString({}, { message: 'Last working date must be a valid date in YYYY-MM-DD format' })
  lastWorkingDate: string;

  // Custom validation to ensure at least one identifier is provided
  @ValidateIf(o => !o.employeeId && !o.email)
  @IsNotEmpty({ message: 'Either employeeId or email must be provided' })
  _identifier?: any;
}

export class RemoveUsersBulkDto {
  @ApiProperty({
    description: 'Array of users to be removed with their last working dates',
    type: [UserRemovalDto],
    example: [
      {
        "employeeId": "10010580",
        "lastWorkingDate": "2024-05-31"
      },
      {
        "email": "john.doe@company.com",
        "lastWorkingDate": "2024-06-15"
      }
    ]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserRemovalDto)
  users: UserRemovalDto[];

  @ApiProperty({
    description: 'Type of identifier being used consistently across all users',
    example: 'employeeId',
    enum: ['employeeId', 'email'],
    required: false
  })
  @IsOptional()
  @IsString()
  identifierType?: 'employeeId' | 'email';
}