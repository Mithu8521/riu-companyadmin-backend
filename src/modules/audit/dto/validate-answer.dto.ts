import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class ValidateAnswerDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    financialYearId: number;

    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    questionId: number;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    questionTitle: string;    

    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    answerId: number;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    questionType: 'qualitative' | 'yes_no' | 'quantitative' | 'tabular_question' | 'quantitative_trends';

    @ApiProperty()
    @IsOptional()
    @IsString()
    remark: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    validation: string;

}