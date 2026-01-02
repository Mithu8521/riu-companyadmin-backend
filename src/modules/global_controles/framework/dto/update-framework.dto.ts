import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class UpdateFrameworkDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  frameworkId: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  frameworkTitle: string;
}
