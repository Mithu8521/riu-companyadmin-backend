import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class FilterGraphDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    graphName: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    filter: string;
}