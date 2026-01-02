import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class DeleteTopicDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  topicId: number;
}
