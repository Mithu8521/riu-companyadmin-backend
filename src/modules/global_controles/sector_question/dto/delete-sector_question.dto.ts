import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class DeleteSectorQuestionDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  questionId: number;
}
