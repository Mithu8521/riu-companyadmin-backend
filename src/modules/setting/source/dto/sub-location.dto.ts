import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
export class CreateSubLocationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  subLocation: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  locationId: number;
}
