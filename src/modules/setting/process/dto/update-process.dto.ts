import { PartialType } from '@nestjs/mapped-types';
import { CreateProcessDto } from './create-process.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class UpdateProcessDto extends PartialType(CreateProcessDto) {
    @ApiProperty()
    @IsNumber()
    @IsNotEmpty()
    id: number;
  
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    process: string;
}
