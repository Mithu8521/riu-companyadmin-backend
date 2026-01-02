import { ApiProperty } from '@nestjs/swagger';
import { AtLeastOneOf } from '@utils/common/validators/at-least-one-of.validator';
import { IsBoolean, IsEmail, IsNumber, IsOptional, IsString, ValidateIf } from 'class-validator';


@AtLeastOneOf(['emailId', 'employeeId'], {
  message: 'Either emailId or employeeId must be provided.',
})
export class CreateSubUserDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @ValidateIf((obj) => obj.emailId !== null && obj.emailId !== undefined && obj.emailId.trim() !== '')
  @IsEmail({}, { message: 'Invalid email format' })
  emailId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  employeeId?: string;

  @ApiProperty()
  @IsString()
  firstName: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  lastName: string;

  @ApiProperty()
  @IsString()
  mobileNumber: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  gender: string;

  @ApiProperty()
  @IsOptional()
  categoryId: any;

  @ApiProperty()
  @IsOptional()
  @IsString()
  companyName: string;

  @ApiProperty()
  @IsNumber()
  invitedBy: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  companyId: number;

  @ApiProperty()
  @IsNumber()
  designationId: number;

  @ApiProperty()
  @IsOptional()
  @IsString()
  businessUnit: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  division: string;

  @ApiProperty()
  @IsString()
  sourceId: string;

  @ApiProperty()
  @IsNumber()
  roleId: number;

  @ApiProperty()
  @IsOptional()
  @IsString()
  joiningDate: string;

  @ApiProperty({ default: false, required: false })
  @IsOptional()
  @IsBoolean()
  status: boolean;
}
