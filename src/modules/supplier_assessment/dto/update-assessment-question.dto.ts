import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
export class UpdateAssessmentQuestionDto {
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
    finanacialYearId: number;

    @ApiProperty({ default: [], required: false, type: [Number] })
    @IsOptional()
    @IsInt({ each: true }) 
    questionIds: number[];
}
