import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ReportingModuleDaoService } from '@modules/dao/reporting-module-dao/reporting-module-dao.service';
import { IntensityMetricDto } from '../dto/intensity-metric.dto';
import { WasteProducedCalculator } from './waste-produced.calculator';
import { IntensityType } from '../enums/intensity-type.enum';

@Injectable()
export class HazardousWasteProducedCalculator extends WasteProducedCalculator {
  intensityType = IntensityType.HazardousWasteIntensity;

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
       * 412: e-waste
       * 550: Cooking/Diesel oil waste
       * 551: spent formalin solution disposed
       */
      const questionIds = [412, 550, 551];
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
              // Skip index 0 (plastic), 2 (biomedical), 3 (construction and demolition), 7 (other non-hazardous)
              if (index === 0 || index === 2 || index === 3 || index === 7) return acc;
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

}
