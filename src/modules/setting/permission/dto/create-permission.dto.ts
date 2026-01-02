import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsJSON,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
export class CreatePermissionDto {
  @ApiProperty()
  @IsNumber()
  role_id: number;

  @ApiProperty()
  @IsNumber()
  sequence_id: number;

  @ApiProperty()
  @IsString()
  permission: string;

  @ApiProperty()
  @IsNumber()
  created_by: number;

  @ApiProperty({ default: true,required: false})
  @IsBoolean()
  @IsOptional()
  is_deletable: boolean;
  
}