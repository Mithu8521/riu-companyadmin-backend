import { ApiProperty } from '@nestjs/swagger';
import { PlateformType } from '@utils/enums/Status';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
export class CreateAssesmentQuestionDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  financialYearId: number;

  @ApiProperty()
  @IsNotEmpty()
  entity: PlateformType;

  @ApiProperty()
  @IsString()  
  questions: string;

}
