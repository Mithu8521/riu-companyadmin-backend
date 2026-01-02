import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class AddRowSectorQuestionDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  question_id: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  row_value: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  type: string;
}
