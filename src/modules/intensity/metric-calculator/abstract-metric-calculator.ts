import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ReportingModuleDaoService } from '@modules/dao/reporting-module-dao/reporting-module-dao.service';
import { IntensityMetricDto } from '../dto/intensity-metric.dto';
import { MetricCalculator } from './metric-calculator.interface';
import { IntensityType } from '../enums/intensity-type.enum';

@Injectable()
export abstract class AbstractMetricCalculator implements MetricCalculator {

    abstract intensityType: IntensityType;

    constructor(
    protected readonly reportingModuleDaoService: ReportingModuleDaoService,
    ) {}

    abstract calculate(financialYearId: number, frameworkIds: number[]): Promise<IntensityMetricDto[]>;

    protected abstract calculateForBrsrFramework(questionIds: number[], financialYearId: number): Promise<IntensityMetricDto[]>;

    protected abstract calculateForManipalFramework(questionIds: number[], financialYearId: number): Promise<IntensityMetricDto[]>;

    protected async getReportingQuestionAnswers(questionIds: number[], financialYearId: number) {
        try {
            return await this.reportingModuleDaoService.getReportingQuestionAnswers(
                questionIds, financialYearId);    
        } catch (error) {
            console.error(`getReportingQuestionAnswers error for questionIds=${questionIds} and financialYearId=${financialYearId}:\n`, error?.message || error);
            throw new HttpException('Error fetching frameworkIds', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
