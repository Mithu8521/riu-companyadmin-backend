import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class DeleteFrameworkDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  frameworkId: number;
}
