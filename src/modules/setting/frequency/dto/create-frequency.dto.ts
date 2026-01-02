import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty,IsNumber,IsString } from 'class-validator';
export class UpdateFrequencyDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  financialYearId: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  moduleId: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  frequency: string;
}
