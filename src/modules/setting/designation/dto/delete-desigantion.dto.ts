import { ApiProperty } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsNumber } from 'class-validator';
import { CreateDesignationDto } from './create-designation.dto';

export class DeleteDesignationDto extends PartialType(CreateDesignationDto) {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  id: number;
}


