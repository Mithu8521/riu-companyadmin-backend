import { ApiProperty } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsString, IsNumber } from 'class-validator';
import { CreateDesignationDto } from './create-designation.dto';

export class UpdateDesignationDto extends PartialType(CreateDesignationDto) {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  id: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  designation: string;
}
