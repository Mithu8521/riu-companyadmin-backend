import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ReportingModuleDaoService } from '@modules/dao/reporting-module-dao/reporting-module-dao.service';
import { IntensityMetricDto } from '../dto/intensity-metric.dto';
import { WasteProducedCalculator } from './waste-produced.calculator';
import { IntensityType } from '../enums/intensity-type.enum';

@Injectable()
export class NonHazardousWasteProducedCalculator extends WasteProducedCalculator {
  intensityType = IntensityType.NonHazardousWasteIntensity;

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
       */
      const questionIds = [400, 401, 402, 545, 404, 546, 547, 548, 408];
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
              // index 0 (plastic), 3 (construction and demolition), 7 (other non-hazardous)
              // skip index  2 (biomedical)
              if ((index === 2 ) || (index !== 0 && index !== 3 && index !== 7)) return acc;
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
