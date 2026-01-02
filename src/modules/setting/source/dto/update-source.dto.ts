import { PartialType } from '@nestjs/mapped-types';
import { CreateSourceDto } from './create-source.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateSourceDto extends PartialType(CreateSourceDto) {
    @ApiProperty()
    @IsNumber()
    @IsNotEmpty()
    id: number;
  
    @ApiProperty()
    @IsString()
    @IsOptional()
    location?: string;
  
    @ApiProperty()
    @IsString()
    @IsOptional()
    company_name?: string;
}
