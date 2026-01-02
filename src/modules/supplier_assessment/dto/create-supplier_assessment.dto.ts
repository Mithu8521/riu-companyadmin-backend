import { ApiProperty } from "@nestjs/swagger";
import { IsArray , IsInt, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
export class CreateSupplierAssessmentDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    title: string;
  
    @ApiProperty()
    @IsNumber()
    @IsNotEmpty()
    financialYearId: number;

    @ApiProperty({ default: [],required: false, type: [Number] })
    @IsOptional()
    @IsInt({ each: true }) 
    questionIds: number[]; 
}
