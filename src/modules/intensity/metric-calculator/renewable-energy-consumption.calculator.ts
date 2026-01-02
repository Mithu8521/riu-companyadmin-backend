import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ReportingModuleDaoService } from '@modules/dao/reporting-module-dao/reporting-module-dao.service';
import { IntensityMetricDto } from '../dto/intensity-metric.dto';
import { EnergyConsumptionCalculator } from './energy-consumption.calculator';
import { IntensityType } from '../enums/intensity-type.enum';


@Injectable()
export class RenewableEnergyConsumptionCalculator extends EnergyConsumptionCalculator {
  intensityType = IntensityType.RenewableEnergyIntensity;

  constructor(
    protected readonly reportingModuleDaoService: ReportingModuleDaoService,
  ) {
    super(reportingModuleDaoService);
  }

  async calculate(financialYearId: number, frameworkIds: number[]): Promise<IntensityMetricDto[]> {
    if (frameworkIds.includes(1)) {
      /**
       * 451: Energy Consumption from Renewable Sources
       */
      const questionIds = [451];
      return await this.calculateForBrsrFramework(questionIds, financialYearId);
    }
    else if (frameworkIds.includes(48)) {
      /**
       * 429: Electricity from renewable sources (via PPA)
       * 430: Electricity from renewable sources (rooftop)
       */
      const questionIds = [429, 430];
      return await this.calculateForManipalFramework(questionIds, financialYearId);
    }

    throw new HttpException(`Unsupported Framework with ID(s): ${frameworkIds.join(', ')}`, HttpStatus.NOT_FOUND);
  }
}
