import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class UpdateDueDateDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    questionId: number;

    @ApiProperty()
    @IsNotEmpty()
    // @IsDate()
    dueDate: string;
}
