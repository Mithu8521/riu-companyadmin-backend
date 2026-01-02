import { Type } from 'class-transformer';
import { IsInt, IsString, IsUrl, ValidateNested, IsEnum, IsOptional } from 'class-validator';
import { ReportGenerationSettingDto } from './report-generation-settings.dto';

export enum ReportType {
    PDF = 'PDF',
    DOCX = 'DOCX',
    EXCEL = 'EXCEL',
}

export class GenerateReportRequestDto {
    @IsInt()
    financialYearId: number;

    @IsInt()
    frameworkId: number;

    @IsEnum(ReportType)
    reportType: ReportType;
}

export class GenerateReportResponseDto {
    @IsInt()
    financialYearId: number;

    @IsInt()
    frameworkId: number;

    @IsEnum(ReportType)
    reportType: ReportType;

    @IsString()
    @IsUrl()
    reportUrl: string;

    @IsString()
    @IsOptional()
    message: string;
}
