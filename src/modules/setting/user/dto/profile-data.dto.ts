import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';
export class CompanyDetalisDto {
  @ApiProperty()
  @IsNumber()
  userId: number;
}
