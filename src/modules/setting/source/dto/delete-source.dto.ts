import { PartialType } from '@nestjs/mapped-types';
import { CreateSourceDto } from './create-source.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class DeleteSourceDto extends PartialType(CreateSourceDto) {
    @ApiProperty()
    @IsNumber()
    @IsNotEmpty()
    id: number;
}
