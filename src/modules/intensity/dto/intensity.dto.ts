import { IsNumber, IsEnum, IsNotEmpty, IsString, Matches, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { IntensityType } from '../enums/intensity-type.enum';
import { IntensityQuestionAnswerDto } from './intensity-question-answer.dto';


export class IntensityDto {
    @Type(() => Number)
    @IsNumber()
    @IsNotEmpty()
    financialYearId: number;

    @IsEnum(IntensityType, {
    message: `intensityType must be one of: ${Object.values(IntensityType).join(', ')}`,
    })
    @IsNotEmpty()
    type: IntensityType;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    sourceId: number;
    
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    subLocationId: number;

    @IsString()
    @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
        message: 'fromDate must be in YYYY-MM format',
    })
    fromDate: string;

    @IsString()
    @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
        message: 'fromDate must be in YYYY-MM format',
    })
    toDate: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => IntensityQuestionAnswerDto)
    intensityQuestionAnswers: IntensityQuestionAnswerDto[];
}
