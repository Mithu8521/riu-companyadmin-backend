import { ApiProperty } from '@nestjs/swagger';
import { TrainingStatus } from '@utils/enums/Status';
import { IsEnum, IsNotEmpty, IsNumber } from 'class-validator';

export class ValidateTraineeDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    trainingId: number;

    @ApiProperty({ enum:  TrainingStatus})
    @IsNotEmpty()
    @IsEnum(TrainingStatus)
    trainingStatus: TrainingStatus;
}