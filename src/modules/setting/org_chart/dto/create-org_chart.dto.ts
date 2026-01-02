import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString } from "class-validator";
export class CreateOrgChartDto {
    @ApiProperty()
    @IsString()
    orgChart: string;

    @ApiProperty()
    @IsNumber()
    @IsOptional()
    userId?: number;

    @ApiProperty()
    @IsNumber()
    @IsOptional()
    parentUserId?: number;

    @ApiProperty()
    @IsString()
    @IsOptional()
    validateAudit?: string;
}
