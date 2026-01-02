import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsArray, ArrayMinSize, IsNumber } from 'class-validator';

export class CreateTopicDto {
  @ApiProperty({ 
    example: 'Leadership Development', 
    description: 'Topic name' 
  })
  @IsString()
  @IsNotEmpty()
  topic: string;

  @ApiProperty({ 
    type: [Number],
    example: [1, 2, 3],
    description: 'Array of principle IDs' 
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one principle must be selected' })
  @IsNumber({}, { each: true, message: 'Each principle must be a number' })
  principles: number[];
}