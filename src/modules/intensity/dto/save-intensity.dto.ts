import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Matches, ValidateIf } from "class-validator";
import { IntensityType } from "../enums/intensity-type.enum";
import { Type } from "class-transformer";

export class SaveIntensityDto {
    @IsNumber()
    @IsNotEmpty()
    financialYearId: number;

    @IsNumber()
    @IsNotEmpty()
    questionId: number;

    @IsOptional()
    @IsNumber()
    sourceId?: number;

    @IsOptional()
    @IsNumber()
    subLocationId?: number;

    @IsString()
    @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
        message: 'fromDate must be in YYYY-MM format',
    })
    fromDate: string;

    @IsString()
    @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
        message: 'toDate must be in YYYY-MM format',
    })
    toDate: string;

    @ValidateIf((o) => o.answer !== undefined && o.answer !== null && o.answer.trim() !== '')
    @Type(() => Number)
    @IsNumber({}, { message: 'answer must be a decimal number' })
    @IsOptional()
    answer?: number;
}
