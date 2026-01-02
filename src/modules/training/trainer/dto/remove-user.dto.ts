import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsArray,
  ValidateNested,
  IsOptional,
  IsEmail,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';

export class TrainingUserRemovalDto {
  @ApiProperty({
    description: 'Training ID from which user will be removed',
    example: '123'
  })
  @IsString()
  @IsNotEmpty()
  trainingId: string;

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

  // Custom validation to ensure at least one identifier is provided
  @ValidateIf(o => !o.employeeId && !o.email)
  @IsNotEmpty({ message: 'Either employeeId or email must be provided' })
  _identifier?: any;
}

export class RemoveUsersFromTrainingBulkDto {
  @ApiProperty({
    description: 'Array of training users to be removed',
    type: [TrainingUserRemovalDto],
    example: [
      {
        "trainingId": "123",
        "employeeId": "10010580"
      },
      {
        "trainingId": "124", 
        "email": "john.doe@company.com"
      }
    ]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TrainingUserRemovalDto)
  trainingUsers: TrainingUserRemovalDto[];

  @ApiProperty({
    description: 'Type of identifier being used consistently across all training users',
    example: 'employeeId',
    enum: ['employeeId', 'email'],
    required: false
  })
  @IsOptional()
  @IsString()
  identifierType?: 'employeeId' | 'email';
}