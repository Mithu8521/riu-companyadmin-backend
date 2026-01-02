import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ReportingModuleDaoService } from '@modules/dao/reporting-module-dao/reporting-module-dao.service';
import { IntensityMetricDto } from '../dto/intensity-metric.dto';
import { AbstractMetricCalculator } from './abstract-metric-calculator';
import { IntensityType } from '../enums/intensity-type.enum';

@Injectable()
export class WasteProducedCalculator extends AbstractMetricCalculator {
  intensityType = IntensityType.WasteIntensity;

  constructor(
    protected readonly reportingModuleDaoService: ReportingModuleDaoService,
  ) {
    super(reportingModuleDaoService);
  }

  async calculate(financialYearId: number, frameworkIds: number[]): Promise<IntensityMetricDto[]> {
    if (frameworkIds.includes(1)) {
      /**
       * 458: Waste Management
       */
      const questionIds = [458];
      return await this.calculateForBrsrFramework(questionIds, financialYearId);
    }
    else if (frameworkIds.includes(48)) {
      /**
       * 400: non-hazardous solid waste generation (black category general waste)*(KG)
       * 401: non-hazardous waste send to landfill (construction waste/other waste to landfill)*
       * 402: packaging waste (non-plastic cardboard)
       * 545: packaging waste (non-plastic paper)
       * 404: packaging waste (plastic)
       * 546: Iron waste
       * 547: Aluminium waste
       * 548: Copper waste
       * 408: Food/Kitchen waste
       * 412: e-waste
       * 550: Cooking/Diesel oil waste
       * 551: spent formalin solution disposed
       */
      const questionIds = [400, 401, 402, 545, 404, 546, 547, 548, 408, 412, 550, 551];
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

    const reportingQuestionAnswers = await this.getReportingQuestionAnswers(questionIds, financialYearId);

    return reportingQuestionAnswers.map(reportingQuestionAnswer => {
      let totalWasteProduced = 0;
      try {
        const parsed = JSON.parse(reportingQuestionAnswer.answer);
        if (Array.isArray(parsed)) {
          const wasteProduced = parsed[0];
          if (Array.isArray(wasteProduced)) {
            totalWasteProduced = wasteProduced.reduce((acc, val, index) => {
              // Skip index 2 for BioMedical waste
              if (index === 2) return acc;
              const num = parseFloat(val);
              return acc + (isNaN(num) ? 0 : num);
            }, 0);
          }
        }
      } catch (e) {
        totalWasteProduced = 0;
      }

      const intensityMetric = new IntensityMetricDto();
      intensityMetric.financialYearId = reportingQuestionAnswer.financialYearId;
      intensityMetric.sourceId = reportingQuestionAnswer.sourceId;
      intensityMetric.subLocationId = reportingQuestionAnswer.subLocationId;
      intensityMetric.fromDate = reportingQuestionAnswer.fromDate;
      intensityMetric.toDate = reportingQuestionAnswer.toDate;
      intensityMetric.intensityType = this.intensityType;
      intensityMetric.metricValue = parseFloat(totalWasteProduced.toFixed(5));
      
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
          totalWasteProduced: 0
        };
      }
      // Parse answer to get readingValue
      let readingValue = 0;
      try {
        const answer = typeof item.answer === 'string' ? JSON.parse(item.answer) : item.answer;
        readingValue = parseFloat(answer?.readingValue) || 0;
      } catch (error) {
      }
      acc[key].totalWasteProduced += readingValue;
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
      intensityMetric.metricValue = parseFloat(consumption.totalWasteProduced.toFixed(5));
      
      return intensityMetric;
    });
  }

}
