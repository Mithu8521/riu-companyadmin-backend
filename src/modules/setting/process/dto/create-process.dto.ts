import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty,IsString } from 'class-validator';
export class CreateProcessDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  process: string;
}
