import { ApiProperty } from '@nestjs/swagger';
import { Gender } from '@utils/enums/Status';
import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';

export class SignUpExternalTraineeDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  mobileNumber: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  employeeId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  token?: string;

  @ApiProperty({ enum: Gender, required: false })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiProperty()
  @IsNotEmpty()
  // @IsNumber()
  companyName: any;
}
