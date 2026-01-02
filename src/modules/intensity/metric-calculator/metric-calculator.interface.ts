import { IntensityMetricDto } from "../dto/intensity-metric.dto";

export interface MetricCalculator {
  calculate(financialYearId: number, frameworkIds: number[]): Promise<IntensityMetricDto[]>;
}
