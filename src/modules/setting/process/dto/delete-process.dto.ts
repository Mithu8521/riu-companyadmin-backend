import { ApiProperty } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsNumber } from 'class-validator';
import { CreateProcessDto } from './create-process.dto';

export class DeleteProcessDto extends PartialType(CreateProcessDto) {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  id: number;
}
