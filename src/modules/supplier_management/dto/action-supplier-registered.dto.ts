import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class ActionSupplierRegistered {
    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    supplierId: number;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    actionType: 'ACTIVE' | 'DEACTIVE'; 
}