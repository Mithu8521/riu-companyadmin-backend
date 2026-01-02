import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class UpdateGhgDataBaseDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    financialYearId: number;

    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    databaseId: number; 
}