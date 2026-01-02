import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class SaveUnitCatagoryDto {
  @IsNotEmpty()
  @IsNumber()
  catagoryId: number;

  @IsNotEmpty()
  @IsString()
  unit: string;
}

