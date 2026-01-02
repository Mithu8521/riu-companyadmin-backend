import { PartialType } from '@nestjs/mapped-types';
import { CreateTrainingDto } from './create-training.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class UpdateTrainingDto extends PartialType(CreateTrainingDto) {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  trainingId: number;
}
