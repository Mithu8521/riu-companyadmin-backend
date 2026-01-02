import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
export class CreateRoleMasterDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  roleName: string;
}
