import { ApiProperty } from "@nestjs/swagger";
import { ArrayMinSize, IsArray, IsInt, IsNotEmpty, IsNumber } from "class-validator";
export class AssignSupplierAssessmentDto {
    @ApiProperty()
    @IsNumber()
    @IsNotEmpty()
    assessmentId: number;

    @ApiProperty({ required: true, type: [Number] })
    @IsNotEmpty()
    @ArrayMinSize(1) 
    @IsInt({ each: true }) 
    userIds: number[];
}