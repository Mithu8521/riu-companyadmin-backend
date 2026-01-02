import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class RequestDueDateDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    questionId: number;
}
