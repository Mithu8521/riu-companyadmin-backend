import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
export class CreateDesignationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  designation: string;
}
