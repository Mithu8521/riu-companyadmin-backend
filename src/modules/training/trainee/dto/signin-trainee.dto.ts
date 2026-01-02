import { ApiProperty } from '@nestjs/swagger';
import { AtLeastOneOf } from '@utils/common/validators/at-least-one-of.validator';
import { UserType } from '@utils/enums/Status';
import { IsNotEmpty, IsString, IsEnum, IsOptional, ValidateIf, IsEmail } from 'class-validator';


@AtLeastOneOf(['email', 'employeeId'], {
  message: 'Either email or employeeId must be provided.',
})
export class SignInTraineeDto {
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

    @ApiProperty({ enum: UserType })
    @IsNotEmpty()
    @IsEnum(UserType)
    userType: UserType;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    token: string;
}
