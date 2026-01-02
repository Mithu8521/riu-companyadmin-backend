import { Type } from 'class-transformer';
import { IsInt, IsString, IsNotEmpty, IsObject, IsDate, ValidateNested, IsOptional } from 'class-validator';

export class ReportGenerationSettingDto {
    @IsInt()
    id: number;

    @IsInt()
    financialYearId: number;

    @IsInt()
    frameworkId: number;

    @IsString()
    @IsNotEmpty()
    settingName: string;

    @IsObject()
    @IsNotEmpty()
    settingMetaAndAnswer: {};

    @IsDate()
    @Type(() => Date)
    @IsOptional()
    createdAt: Date;

    @IsDate()
    @Type(() => Date)
    @IsOptional()
    updatedAt: Date;
}

export class ReportGenerationSettingsDto {
    @ValidateNested({ each: true })
    @Type(() => ReportGenerationSettingDto)
    reportGenerationSettings: ReportGenerationSettingDto[];
}