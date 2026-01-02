import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ReportingModuleDaoService } from '@modules/dao/reporting-module-dao/reporting-module-dao.service';
import { IntensityMetricDto } from '../dto/intensity-metric.dto';
import { AbstractMetricCalculator } from './abstract-metric-calculator';
import { fuelData, questionIdToFuelData } from './config';
import { IntensityType } from '../enums/intensity-type.enum';

@Injectable()
export class EnergyConsumptionCalculator extends AbstractMetricCalculator {
  intensityType = IntensityType.FuelIntensity;

  private brsrQuestionToFuel = {
    451: ['Geothermal Energy', 'Fuel', 'Other', 'Solar', 'Wind', 'Hydropower'],
    452: ['Grid Electricity', 'Petrol', 'Diesel', 'CNG', 'PNG', 'LPG', 'Natural Gas', 'Coal', 'Biomass', 'Other']
  }

  constructor(
    protected readonly reportingModuleDaoService: ReportingModuleDaoService,
  ) {
    super(reportingModuleDaoService);
  }

  async calculate(financialYearId: number, frameworkIds: number[]): Promise<IntensityMetricDto[]> {
    if (frameworkIds.includes(1)) {
      /**
       * 451: Energy Consumption from Renewable Sources
       * 452: Energy Consumption from Non-renewable Sources
       */
      const questionIds = [451, 452];
      return await this.calculateForBrsrFramework(questionIds, financialYearId);
    }
    else if (frameworkIds.includes(48)) {
      /**
       * 293: Petrol
       * 289: Diesel
       * 292: LPG
       * 295: PNG
       * 495: Furnace Oil
       * 497: Coal
       * 499: Briquette
       * 468: Grid Electricity
       * 426: Electricity (Captive Power Plant - Natural Gas)
       * 428: Electricity (DG)
       * 429: Electricity from renewable sources (via PPA)
       * 430: Electricity from renewable sources (rooftop)
       * 512: Nitrous Oxide
       * 513: Carbon Dioxide
       * 515: Desflurane
       * 516: Isoflurane
       * 523: Sevitrue
       * 517: Sevoflurane
       * 524: Suprane
       * 526: Sevorane
       * 514: Entonox
       * 518: R-134A
       * 519: R-22
       * 520: R-407C
       * 521: R-32
       * 522: R-410A
       */
      // const questionIds = [293, 289, 292, 295, 495, 497, 499, 468, 426, 428, 429, 430, 512, 513, 515, 516, 523, 517, 524, 526, 514, 518, 519, 520, 521, 522];
      const questionIds = [293, 289, 292, 295, 495, 497, 499, 512, 513, 515, 516, 523, 517, 524, 526, 514, 518, 519, 520, 521, 522];
      return await this.calculateForManipalFramework(questionIds, financialYearId);
    }

    throw new HttpException(`Unsupported Framework with ID(s): ${frameworkIds.join(', ')}`, HttpStatus.NOT_FOUND);
  }


  protected async calculateForBrsrFramework(questionIds: number[], financialYearId: number): Promise<IntensityMetricDto[]> {
    const reportingQuestionAnswers = await this.getReportingQuestionAnswers(questionIds, financialYearId);

    return reportingQuestionAnswers.map(reportingQuestionAnswer => {
      const questionId = reportingQuestionAnswer.questionId;
      let totalConsumption = 0;
      try {
        const parsed = JSON.parse(reportingQuestionAnswer.answer);
        if (Array.isArray(parsed)) {
          parsed.map((value, index) => {
            if (index + 1 > this.brsrQuestionToFuel[questionId].length) return;
            const {reading, unit} = this.extractReadingAndUnit(value);
            const fuelType = this.brsrQuestionToFuel[questionId][index];
            if (fuelType in fuelData) {
              totalConsumption += reading * fuelData[fuelType]['calorificValue'] * fuelData[fuelType]['density'];
            } else if (reading && unit.toLowerCase() === 'gj') {
              totalConsumption += reading;
            } else if (reading && unit.toLowerCase() === 'kwh') {
              totalConsumption += reading * 0.0036;
            } else {
              throw new HttpException(`Unknown or unsupported unit for energy: ${unit}`, HttpStatus.CONFLICT);
            }
          });
        }
      } catch (e) {
        totalConsumption = 0;
      }

      const intensityMetric = new IntensityMetricDto();
      intensityMetric.financialYearId = reportingQuestionAnswer.financialYearId;
      intensityMetric.sourceId = reportingQuestionAnswer.sourceId;
      intensityMetric.subLocationId = reportingQuestionAnswer.subLocationId;
      intensityMetric.fromDate = reportingQuestionAnswer.fromDate;
      intensityMetric.toDate = reportingQuestionAnswer.toDate;
      intensityMetric.intensityType = this.intensityType;
      intensityMetric.metricValue = parseFloat(totalConsumption.toFixed(5));
      
      return intensityMetric;
    });
  }

  protected async calculateForManipalFramework(questionIds: number[], financialYearId: number): Promise<IntensityMetricDto[]> {

    const reportingQuestionAnswers = await this.getReportingQuestionAnswers(questionIds, financialYearId);

    const aggregatedConsumptionByKey = reportingQuestionAnswers.reduce((acc, item) => {
      const key = `${item.financialYearId}-${item.sourceId}-${item.subLocationId}-${item.fromDate}-${item.toDate}`;
      if (!acc[key]) {
        acc[key] = {
          financialYearId: item.financialYearId,
          sourceId: item.sourceId,
          subLocationId: item.subLocationId,
          fromDate: item.fromDate,
          toDate: item.toDate,
          totalConsumption: 0
        };
      }
      // Parse answer to get readingValue
      let readingValue = 0;
      try {
        const answer = typeof item.answer === 'string' ? JSON.parse(item.answer) : item.answer;
        readingValue = parseFloat(answer?.readingValue) || 0;
      } catch (error) {
      }

      acc[key].totalConsumption += (readingValue * questionIdToFuelData[item.questionId]['calorificValue'] * questionIdToFuelData[item.questionId]['density']);
      return acc;
    }, {});

    return Object.values(aggregatedConsumptionByKey).map((consumption: any) => {
      const intensityMetric = new IntensityMetricDto();
      intensityMetric.financialYearId = consumption.financialYearId;
      intensityMetric.sourceId = consumption.sourceId;
      intensityMetric.subLocationId = consumption.subLocationId;
      intensityMetric.fromDate = consumption.fromDate;
      intensityMetric.toDate = consumption.toDate;
      intensityMetric.intensityType = this.intensityType;
      intensityMetric.metricValue = parseFloat(consumption.totalConsumption.toFixed(5));
      
      return intensityMetric;
    });
  }

  private extractReadingAndUnit(value: any): { reading: number, unit?: string } {
    let reading: number | undefined = undefined;
    let unit: string | undefined = undefined;

    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === 'number' && reading === undefined) {
          reading = item;
        } else if (typeof item === 'string') {
          const num = parseFloat(item);
          if (!isNaN(num) && reading === undefined) {
            reading = num;
          } else if (!unit) {
            unit = item;
          }
        }
      }
    } else if (typeof value === 'number') {
      reading = value;
    } else if (typeof value === 'string') {
      const num = parseFloat(value);
      if (!isNaN(num)) {
        reading = num;
      }
    }

    return {
      reading: reading ?? 0,
      unit: reading !== undefined ? unit : undefined,
    };
  }
}
