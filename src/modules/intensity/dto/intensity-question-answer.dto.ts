import { IsNumber, IsEnum, IsNotEmpty, IsString, Matches, IsOptional, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { IntensityType } from '../enums/intensity-type.enum';


export class IntensityQuestionAnswerDto {
    @Type(() => Number)
    @IsNumber()
    @IsNotEmpty()
    questionId: number;

    @IsString()
    @IsNotEmpty()
    title: string;
    
    @Type(() => Number)
    @IsOptional()
    @IsNumber({}, { message: 'answer must be a number if provided' })
    answer?: number;

    @IsBoolean()
    isAnswerEditable: boolean = true;
  
    @Type(() => Number)
    @IsOptional()
    @IsNumber({}, { message: 'metricValue must be a number if provided' })
    metricValue?: number;
}
