import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';
export class CreateSetTargetDataQuestionDto {
    @IsNotEmpty()
    @IsNumber()
    financialYearId: number;

    @IsNotEmpty()
    @IsNumber()
    questionId: number;

    @IsNotEmpty()
    @IsString()
    questionTitle: string;

    @IsNotEmpty()
    @IsString()
    unit: string;

    @IsOptional()
    @IsNumber()
    sourceId?: number;

    @IsOptional()
    @IsString()
    fromDate: string;

    @IsOptional()
    @IsString()
    toDate: string;

    minTrigger?: string;

    maxTrigger?: string;

    columnId?: number;

    rowId?: number;

    @IsNotEmpty()
    @IsString()
    questionType: 'qualitative' | 'yes_no' | 'quantitative' | 'tabular_question' | 'quantitative_trends';
}
