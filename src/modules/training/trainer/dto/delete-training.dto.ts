import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class DeleteTrainingDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    trainingId: number;

    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    status: number;
}
