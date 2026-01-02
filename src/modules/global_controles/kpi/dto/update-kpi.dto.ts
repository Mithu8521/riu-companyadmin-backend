import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class UpdateKpiDto {
    @ApiProperty()
    @IsNumber()
    @IsNotEmpty()
    kpiId: number;

    @ApiProperty()
    @IsNumber()
    @IsNotEmpty()
    topicId: number;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    kpiTitle: string;    
}
