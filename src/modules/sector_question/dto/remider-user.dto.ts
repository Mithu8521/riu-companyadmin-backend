import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class ReminderUserDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    questionId: number;
}
