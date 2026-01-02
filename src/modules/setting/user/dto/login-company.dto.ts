import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';
import { AtLeastOneOf } from '@utils/common/validators/at-least-one-of.validator';


@AtLeastOneOf(['email', 'employeeId'], {
  message: 'Either email or employeeId must be provided.',
})
export class LoginCompanyDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @ValidateIf((obj) => obj.email !== null && obj.email !== undefined && obj.email.trim() !== '')
  @IsEmail({}, { message: 'Invalid email format' })
  email?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  employeeId?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  password: string;
}
