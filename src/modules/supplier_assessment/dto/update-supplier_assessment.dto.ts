import { ApiProperty } from "@nestjs/swagger";
import { ArrayMinSize, IsArray, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
export class UpdateSupplierAssessmentDto {
    @ApiProperty()
    @IsNumber()
    @IsNotEmpty()
    assessmentId: number;

    @ApiProperty()
    @IsString()
    @IsOptional()
    title: string;

    @ApiProperty()
    @IsNumber()
    @IsOptional()
    financialYearId: number;

    @ApiProperty({ required: false, type: [Number] })
    @IsOptional()
    @IsInt({ each: true }) 
    questionIds: number[];
}
