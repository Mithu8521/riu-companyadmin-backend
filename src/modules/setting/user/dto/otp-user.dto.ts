import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
} from 'class-validator';
export class OtpSendDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  email: string;
}