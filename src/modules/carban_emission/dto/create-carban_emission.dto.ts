import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty } from 'class-validator';

export class FuelConsumptionDto {
  @ApiProperty({
    description: 'The ID of the fuel ',
    example: 1
  })
  @IsNumber()
  @IsNotEmpty()
  fuelId: number;

  @ApiProperty({
    description: 'The ID of the financial year',
    example: 1
  })
  @IsNumber()
  @IsNotEmpty()
  financialYearId: number;

  @ApiProperty({
    description: 'The consumption value',
    example: 100.5
  })
  @IsNumber()
  @IsNotEmpty()
  consumption: number;
}
