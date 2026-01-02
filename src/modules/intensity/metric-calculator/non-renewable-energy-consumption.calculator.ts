import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ReportingModuleDaoService } from '@modules/dao/reporting-module-dao/reporting-module-dao.service';
import { IntensityMetricDto } from '../dto/intensity-metric.dto';
import { EnergyConsumptionCalculator } from './energy-consumption.calculator';
import { IntensityType } from '../enums/intensity-type.enum';

@Injectable()
export class NonRenewableEnergyConsumptionCalculator extends EnergyConsumptionCalculator {
  intensityType = IntensityType.ElectricityIntensity;

  constructor(
    protected readonly reportingModuleDaoService: ReportingModuleDaoService,
  ) {
    super(reportingModuleDaoService);
  }

  async calculate(financialYearId: number, frameworkIds: number[]): Promise<IntensityMetricDto[]> {
    if (frameworkIds.includes(1)) {
      /**
       * 452: Energy Consumption from Non-renewable Sources
       */
      const questionIds = [452];
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
      // const questionIds = [293, 289, 292, 295, 495, 497, 499, 468, 426, 428, 512, 513, 515, 516, 523, 517, 524, 526, 514, 518, 519, 520, 521, 522];
      const questionIds = [468, 426, 428, 429, 430];
      return await this.calculateForManipalFramework(questionIds, financialYearId);
    }

    throw new HttpException(`Unsupported Framework with ID(s): ${frameworkIds.join(', ')}`, HttpStatus.NOT_FOUND);
  }
}
