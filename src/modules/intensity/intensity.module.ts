import { Module } from '@nestjs/common';
import { IntensityService } from './intensity.service';
import { IntensityController } from './intensity.controller';
import { DaoModule } from '@modules/dao/dao.module';
import { UtilsModule } from '@utils/utils.module';
import { WaterConsumptionCalculator } from './metric-calculator/water-consumption.calculator';
import { CarbonEmissionsCalculator } from './metric-calculator/carbon-emissions.calculator';
import { WasteProducedCalculator } from './metric-calculator/waste-produced.calculator';
import { BioWasteProducedCalculator } from './metric-calculator/biowaste-produced.calculator';
import { EnergyConsumptionCalculator } from './metric-calculator/energy-consumption.calculator';
import { MetricCalculatorFactory } from './metric-calculator/metric-calculator.factory';
import { NonHazardousWasteProducedCalculator } from './metric-calculator/non-hazardous-waste-produced.calculator';
import { HazardousWasteProducedCalculator } from './metric-calculator/hazardous-waste-produced.calculator';
import { RenewableEnergyConsumptionCalculator } from './metric-calculator/renewable-energy-consumption.calculator';
import { NonRenewableEnergyConsumptionCalculator } from './metric-calculator/non-renewable-energy-consumption.calculator';
import { UserModule } from '../setting/user/user.module';
import { SuperAdminClientModule } from '../super-admin-client/super-admin-client.module';

@Module({
  imports: [
    DaoModule,
    UtilsModule,
    UserModule,
    SuperAdminClientModule
  ],
  controllers: [IntensityController],
  providers: [
    IntensityService,
    MetricCalculatorFactory,
    CarbonEmissionsCalculator,
    WaterConsumptionCalculator,
    WasteProducedCalculator,
    NonHazardousWasteProducedCalculator,
    HazardousWasteProducedCalculator,
    BioWasteProducedCalculator,
    EnergyConsumptionCalculator,
    RenewableEnergyConsumptionCalculator,
    NonRenewableEnergyConsumptionCalculator
  ],
})
export class IntensityModule {}
