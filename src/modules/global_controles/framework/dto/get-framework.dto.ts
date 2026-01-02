import { ApiProperty } from "@nestjs/swagger";
import { IsNumber } from "class-validator";

export class GetFrameworkDto {
    @ApiProperty()
    @IsNumber()
    companyId: number;  
}
