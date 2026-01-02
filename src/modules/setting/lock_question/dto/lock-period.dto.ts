import { 
  IsNotEmpty, 
  IsNumber, 
  IsString, 
  IsOptional, 
  IsArray, 
  IsIn 
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LockPeriodDto {
  @ApiProperty({ description: 'Financial Year ID', example: 1 })
  @IsNotEmpty()
  @IsNumber()
  financialYearId: number;

  @ApiProperty({ description: 'Period start date in YYYY-MM format', example: '2024-01', required: false })
  @IsOptional()
  @IsString()
  fromDate?: string;

  @ApiProperty({ description: 'Period end date in YYYY-MM format', example: '2024-01', required: false })
  @IsOptional()
  @IsString()
  toDate?: string;

  @ApiProperty({ 
    description: 'Array of user IDs allowed to access the locked period', 
    example: [1, 2, 3], 
    type: [Number],
    required: false 
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  allowedUsers?: number[];

  @ApiProperty({ description: 'Reason for locking or unlocking', example: 'Data entry completed', required: false })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({
    description: 'Type of operation (lock or unlock)',
    example: 'lock',
    enum: ['locked', 'unlocked'],
  })
  @IsNotEmpty()
  @IsString()
  @IsIn(['locked', 'unlocked'], { message: 'Type must be either lock or unlock' })
  type: string;
}
