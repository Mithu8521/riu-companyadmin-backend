import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { CreateRoleMasterDto } from './create-role-master.dto';

export class DeleteRoleMasterDto extends PartialType(CreateRoleMasterDto) {
    @ApiProperty()
    @IsNumber()
    @IsNotEmpty()
    id: number;
  }
