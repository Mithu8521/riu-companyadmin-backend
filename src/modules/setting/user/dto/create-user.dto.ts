// zbUsers.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { AtLeastOneOf } from '@utils/common/validators/at-least-one-of.validator';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';


@AtLeastOneOf(['email', 'employeeId'], {
  message: 'Either email or employeeId must be provided.',
})
export class CreateCompanyDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  parent_id: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  group_admin_id: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  company_id: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  user_type_code: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  role_id: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  register_company_name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  first_name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  last_name: string;

  @ApiProperty({required: false})
  @IsString()
  @IsOptional()
  email?: string;

  @ApiProperty({required: false})
  @IsString()
  @IsOptional()
  employeeId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  country: string;

  @ApiProperty()
  @IsString()
  password: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  mobile_number: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  profile_picture: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  access_token: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  source_ids: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  broker_commision: number;

  @ApiProperty()
  @IsEnum(['MONTHLY', 'QUATERLY', 'YEARLY', 'HALF_YEARLY'])
  frequency: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  starting_month: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  device: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  business_number: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  company_industry_id: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  company_industry: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  position: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  charge_type: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  charge_value: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEnum(['Partner', 'Business Account'])
  user_category: string;

  @ApiProperty({ default: false ,required: false})
  @IsOptional()
  @IsBoolean()
  status: boolean;
}
