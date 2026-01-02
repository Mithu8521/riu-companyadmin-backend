import { Injectable } from '@nestjs/common';
import { IntensityType } from '../enums/intensity-type.enum';
import { BioWasteProducedCalculator } from './biowaste-produced.calculator';
import { CarbonEmissionsCalculator } from './carbon-emissions.calculator';
import { EnergyConsumptionCalculator } from './energy-consumption.calculator';
import { MetricCalculator } from './metric-calculator.interface';
import { WasteProducedCalculator } from './waste-produced.calculator';
import { WaterConsumptionCalculator } from './water-consumption.calculator';
import { RenewableEnergyConsumptionCalculator } from './renewable-energy-consumption.calculator';
import { NonRenewableEnergyConsumptionCalculator } from './non-renewable-energy-consumption.calculator';
import { HazardousWasteProducedCalculator } from './hazardous-waste-produced.calculator';
import { NonHazardousWasteProducedCalculator } from './non-hazardous-waste-produced.calculator';

@Injectable()
export class MetricCalculatorFactory {
  private readonly calculators: Record<IntensityType, MetricCalculator>;

  constructor(
    private carbonEmissionsCalculator: CarbonEmissionsCalculator,
    private waterConsumptionCalculator: WaterConsumptionCalculator,
    private wasteProducedCalculator: WasteProducedCalculator,
    private hazardousWasteProducedCalculator: HazardousWasteProducedCalculator,
    private nonHazardousWasteProducedCalculator: NonHazardousWasteProducedCalculator,
    private bioWasteProducedCalculator: BioWasteProducedCalculator,
    private energyConsumptionCalculator: EnergyConsumptionCalculator,
    private renewableEnergyConsumptionCalculator: RenewableEnergyConsumptionCalculator,
    private nonRenewableEnergyConsumptionCalculator: NonRenewableEnergyConsumptionCalculator
  ) {
    this.calculators = {
      [IntensityType.CarbonIntensity]: this.carbonEmissionsCalculator,
      [IntensityType.WaterIntensity]: this.waterConsumptionCalculator,
      [IntensityType.WasteIntensity]: this.wasteProducedCalculator,
      [IntensityType.HazardousWasteIntensity]: this.hazardousWasteProducedCalculator,
      [IntensityType.NonHazardousWasteIntensity]: this.nonHazardousWasteProducedCalculator,
      [IntensityType.BioWasteIntensity]: this.bioWasteProducedCalculator,
      [IntensityType.FuelIntensity]: this.energyConsumptionCalculator,
      [IntensityType.RenewableEnergyIntensity]: this.renewableEnergyConsumptionCalculator,
      [IntensityType.ElectricityIntensity]: this.nonRenewableEnergyConsumptionCalculator,
    };
  }

  getCalculator(type: IntensityType): MetricCalculator {
    const calculator = this.calculators[type];
    if (!calculator) {
      throw new Error(`Unsupported intensity type: ${type}`);
    }
    return calculator;
  }
}
