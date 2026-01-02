import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsDate, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class AssignQuestionToAuditorDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  financialYearId: number;

  @ApiProperty({ type: [Number] })
  @IsNotEmpty()
  @IsArray({ each: true })
  questionIds: number[];

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  moduleType: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  auditorId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  questionnaireType: string;

}
