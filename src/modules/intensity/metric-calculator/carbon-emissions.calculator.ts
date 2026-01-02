import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ReportingModuleDaoService } from '@modules/dao/reporting-module-dao/reporting-module-dao.service';
import { IntensityMetricDto } from '../dto/intensity-metric.dto';
import { AbstractMetricCalculator } from './abstract-metric-calculator';
import { fuelData, questionIdToFuelData } from './config';
import { IntensityType } from '../enums/intensity-type.enum';

@Injectable()
export class CarbonEmissionsCalculator extends AbstractMetricCalculator {
  intensityType = IntensityType.CarbonIntensity;

  constructor(
    protected readonly reportingModuleDaoService: ReportingModuleDaoService,
  ) {
    super(reportingModuleDaoService);
  }

  async calculate(financialYearId: number, frameworkIds: number[]): Promise<IntensityMetricDto[]> {
    if (frameworkIds.includes(1)) {
      /**
       * 
       */
      const questionIds = [452];
      return await this.calculateForBrsrFramework(questionIds, financialYearId);
    }
    else if (frameworkIds.includes(48)) {
      /**
       * 
       */
      const questionIds = [289, 293, 295, 292, 495, 497, 499, 468, 426, 428, 430, 429];
      return await this.calculateForManipalFramework(questionIds, financialYearId);
    }

    throw new HttpException(`Unsupported Framework with ID(s): ${frameworkIds.join(', ')}`, HttpStatus.NOT_FOUND);
  }

  protected async calculateForBrsrFramework(questionIds: number[], financialYearId: number): Promise<IntensityMetricDto[]> {
    // 🚫 This method is designed to handle only a single questionId.
    // If multiple questionIds need to be supported, update the logic accordingly.
    if (questionIds.length !== 1) {
      throw new Error(
        `This method only supports a single questionId. Received ${questionIds.length} elements. Please update the implementation if multiple questionIds are required.`
      );
    }
    
    const reportingAnswers = await this.getReportingQuestionAnswers(questionIds, financialYearId);

    reportingAnswers.forEach((item: any) => {
      let totalEmission = 0;
      item.answer = JSON.parse(item.answer).map(([value, unit], index) => {
        let energy = 0;
        let emissions = 0;
        const numericValue = parseFloat(value);
        
        if (isNaN(numericValue) || numericValue === 0 || !unit) {
          return [0.0, 0.0];
        }

        if (unit === 'KWH') {
          energy = (numericValue * 3.6) / 1000;
          emissions = (numericValue * 0.716) / 1000;
        } else if (index === 2) {
          const mass = numericValue * 845;
          energy = (mass * 43) / 1000000;
          emissions = (energy / 1000) * 74100 / 1000;
        } else if (index === 5) {
          energy = numericValue * 0.026; // Convert MJ to GJ
          emissions = energy * 0.060; // Convert kg CO2 to tCO2
        }

        totalEmission += parseFloat(emissions.toFixed(5));
        return [emissions.toFixed(5)];
      });
      
      item.emission = totalEmission;
    });  

    const groupedByKey = reportingAnswers.reduce((acc, item) => {
      const key = `${item.financialYearId}-${item.sourceId}-${item.subLocationId}-${item.fromDate}-${item.toDate}`;
      if (!acc[key]) {
        acc[key] = {
          financialYearId: item.financialYearId,
          sourceId: item.sourceId,
          subLocationId: item.subLocationId,
          fromDate: item.fromDate,
          toDate: item.toDate,
          co2Emissions: []
        };
      }
      acc[key].co2Emissions.push(item.emission);
      return acc;
    }, {});
    return Object.values(groupedByKey).map((group: any) => {
      const totalEmission = group.co2Emissions.reduce((sum, emission) => sum + emission, 0);
      const intensityMetric = new IntensityMetricDto();
      intensityMetric.financialYearId = group.financialYearId;
      intensityMetric.sourceId = group.sourceId;
      intensityMetric.subLocationId = group.subLocationId;
      intensityMetric.fromDate = group.fromDate;
      intensityMetric.toDate = group.toDate;
      intensityMetric.intensityType = this.intensityType;
      intensityMetric.metricValue = totalEmission.toFixed(5);

      return intensityMetric;
    });
  }

  protected async calculateForManipalFramework(questionIds: number[], financialYearId: number): Promise<IntensityMetricDto[]> {
    const reportingAnswers = await this.getReportingQuestionAnswers(questionIds, financialYearId);

    let reportingAnswer = [];

    for (const questionId of questionIds) {
      const fuel = questionIdToFuelData[questionId];
      const tmpans = reportingAnswers.filter((data) => data.questionId === questionId);

      if (fuel) {
        const emissionsData = this.calculateEmissions(tmpans, fuel, questionId);
        reportingAnswer = [...reportingAnswer, ...emissionsData]; 
      }
    }
    const groupedByKey = reportingAnswer.reduce((acc, item) => {
      const key = `${item.financialYearId}-${item.sourceId}-${item.subLocationId}-${item.fromDate}-${item.toDate}`;
      if (!acc[key]) {
        acc[key] = {
          financialYearId: item.financialYearId,
          sourceId: item.sourceId,
          subLocationId: item.subLocationId,
          fromDate: item.fromDate,
          toDate: item.toDate,
          co2Emissions: []
        };
      }
      // Parse answer to get readingValue
      let readingValue = 0;
      try {
        const answer = typeof item.answer === 'string' ? JSON.parse(item.answer) : item.answer;
        readingValue = parseFloat(answer?.readingValue) || 0;
      } catch (error) {
      }
      acc[key].co2Emissions.push(readingValue);
      return acc;
    }, {});

    return Object.values(groupedByKey).map((group: any) => {
      const totalEmission = group.co2Emissions.reduce((sum, emission) => sum + emission, 0);
      const intensityMetric = new IntensityMetricDto();
      intensityMetric.financialYearId = group.financialYearId;
      intensityMetric.sourceId = group.sourceId;
      intensityMetric.subLocationId = group.subLocationId;
      intensityMetric.fromDate = group.fromDate;
      intensityMetric.toDate = group.toDate;
      intensityMetric.intensityType = this.intensityType;
      intensityMetric.metricValue = totalEmission.toFixed(5);

      return intensityMetric;
    });
  }

  private calculateEmissions(dataArray: any[], fuel: any, questionId: number) {
    return dataArray.map(item => {
      let answer = item.answer;

      // Parse if it's a string
      if (typeof answer === "string") {
        try {
          answer = JSON.parse(answer);
        } catch (error) {
          return { ...item, questionId }; // Return item unchanged if parsing fails
        }
      }

      if (answer && answer.readingValue) {
        const readingValue = parseFloat(answer.readingValue); // kg or liters
        const emission = (readingValue * fuel.emissionFactor) / 1000; // Convert to tCO₂

        return {
          ...item,
          questionId,
          fuelType: fuel.fuelType,
          answer: JSON.stringify({ ...answer, readingValue: emission.toFixed(5) }) // Correct syntax
        };
      }

      return { ...item, questionId }; // Default if no valid readingValue
    });
  } 
  
}
