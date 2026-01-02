import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ExternalApiCallService } from '@utils/common/external-api-call/external-api-call.service';
import { CreateEmissionQuestionDto } from './dto/create-emission.dto';
import { EmissionDaoService } from '@modules/dao/setting/emission-dao/emission-dao.service';
import { EmissionSetting } from './entities/emission.entity';

@Injectable()
export class EmissionService {
  constructor(private externalApiCallService: ExternalApiCallService, private emissionDaoService: EmissionDaoService) { }

  async getEmissionFactor(req: any) {
    let body = { type: 'ALL', current_role: 'COMPANY', };
    const emissionQuestion = await this.externalApiCallService.getReq(
      process.env.COMPANY_SERVER_API_URL + 'getEmissionQuestion',
      body,
      {},
    );
    const existingRecord = await this.emissionDaoService.getAnswerEmissions();
    const mergedData = this.mergeByIdAndQuestionId(emissionQuestion.data, existingRecord);
    throw new HttpException({ status: 200, message: 'Data Found', data: mergedData }, HttpStatus.OK);
  }

  async saveEmissionQuestion(createEmissionQuestionDto: CreateEmissionQuestionDto, req: any) {
    const { questionId, density, calorificValue, emissionFactor } = createEmissionQuestionDto;
    const existingRecord = await this.emissionDaoService.getAnswerEmission(questionId);
    if (existingRecord) {
      const answerEntity = this.createEmissionEntity(questionId, density, calorificValue, emissionFactor);
      await this.emissionDaoService.updateEmission(questionId, answerEntity);
    } else if (existingRecord === null) {
      const answerEntity = this.createEmissionEntity(questionId, density, calorificValue, emissionFactor);
      const insertAnswer = await this.emissionDaoService.saveEmission(answerEntity);
    }
    throw new HttpException({ status: 200, message: 'Data Upadted', }, HttpStatus.OK);
  }

  private mergeByIdAndQuestionId(stdData: any[], existingRecord: any[]): any[] {
    return stdData.map(stdItem => {
      const matchingRecord = existingRecord.find(
        record => record.questionId === stdItem.id
      );

      // Add `std` prefix and camel case conversion to `stdItem`
      const stdItemWithPrefix = Object.keys(stdItem).reduce((result, key) => {
        const camelKey = this.toCamelCaseString(key);
        result[`std${camelKey.charAt(0).toUpperCase() + camelKey.slice(1)}`] = stdItem[key];
        return result;
      }, {} as any);

      return {
        ...stdItemWithPrefix,
        ...matchingRecord, // Add matchingRecord fields as-is
      };
    });
  }


  private toCamelCaseString(key: string): string {
    return key.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
  }

  async getEmissionCalculation(req: any) {
    const { value, unit, questionId } = req.query;
    let body = { type: 'ALL', current_role: 'COMPANY' };

    const emissionQuestion = await this.externalApiCallService.getReq(
      process.env.COMPANY_SERVER_API_URL + 'getEmissionQuestion',
      body,
      {},
    );

    const existingRecord = await this.emissionDaoService.getAnswerEmissions();
    const mergedData = this.mergeByIdAndQuestionId(emissionQuestion.data, existingRecord);
    if (Number(questionId) === 452) {
      const tmpData = JSON.parse(value).map(([value, unit], index) => {
        let energy = 0; // in GJ
        let emissions = 0; // in tCO2

        // Convert input to numeric
        const numericValue = parseFloat(value);

        if (isNaN(numericValue) || numericValue === 0 || !unit) {
          // Skip invalid or zero values
          return [0.0, 0.0];
        }

        // Normalize unit string
        const normalizedUnit = unit.trim().toLowerCase();

        // ---- Electricity ----
        if (['kilowatt-hours (kwh)', 'kwh'].includes(normalizedUnit)) {
          energy = (numericValue * 3.6) / 1000; // kWh → GJ
          emissions = (numericValue * 0.727) / 1000; // kg CO2 → tCO2
        } else if (['megawatt-hours (mwh)', 'mwh'].includes(normalizedUnit)) {
          const kWh = numericValue * 1000;
          energy = (kWh * 3.6) / 1000;
          emissions = (kWh * 0.727) / 1000;
        } else if (['gigawatt-hours (gwh)', 'gwh'].includes(normalizedUnit)) {
          const kWh = numericValue * 1_000_000;
          energy = (kWh * 3.6) / 1000;
          emissions = (kWh * 0.727) / 1000;
        }

        // ---- Diesel / Fuel Oil (index 2 only) ----
        else if (index === 2) {
          let massKg = 0;

          if (normalizedUnit === 'liters') {
            massKg = numericValue * 0.845; // liters → kg
          } else if (normalizedUnit === 'gallons') {
            const liters = numericValue * 3.785; // US gallon → liters
            massKg = liters * 0.845;
          } else if (normalizedUnit === 'metric tons') {
            massKg = numericValue * 1000; // 1 t → 1000 kg
          }

          if (massKg > 0) {
            energy = (massKg * 42.25) / 1000; // MJ/kg → GJ
            emissions =
              (energy * 74100 +
                energy * 10 * 27.9 +
                energy * 273 * 0.6) /
              1000000;
          }
        }

        // ---- LPG (index 5 only) ----
        else if (index === 5) {
          let massKg = 0;

          if (normalizedUnit === 'liters') {
            massKg = numericValue * 0.54; // liters → kg
          } else if (normalizedUnit === 'gallons') {
            const liters = numericValue * 3.785; // US gallon → liters
            massKg = liters * 0.54;
          } else if (normalizedUnit === 'metric tons') {
            massKg = numericValue * 1000; // 1 t → 1000 kg
          }

          // if (normalizedUnit === 'cubic meters (m³)' || normalizedUnit === 'm³') {
          //   massKg = numericValue * 2.01; // m³ → kg
          // } else if (normalizedUnit === 'kilograms (kg)' || normalizedUnit === 'kg') {
          //   massKg = numericValue;
          // } else if (normalizedUnit === 'metric tons') {
          //   massKg = numericValue * 1000;
          // }

          if (massKg > 0) {
            energy = (massKg * 46.1) / 1000; // MJ/kg → GJ
            emissions =
              (energy * 63100 +
                energy * 5 * 27.9 +
                energy * 273 * 0.1) /
              1_000_000; // tCO2
          }
        }

        // Replace the original array values with energy and emissions
        return [
          energy.toFixed(2), // Energy in GJ
          emissions.toFixed(2), // Emission in tCO2
        ];
      });

      throw new HttpException(
        { status: 200, message: 'Data Found', data: tmpData },
        HttpStatus.OK,
      );
    }

    if (Number(questionId) === 451) {

      const tmpData = JSON.parse(value).map(([unit, value], index) => {
        let energy = 0; // in GJ
        let emissions = 0; // in tCO2

        // Convert input to numeric
        const numericValue = parseFloat(value);

        if (isNaN(numericValue) || numericValue === 0 || !unit) {
          // Skip invalid or zero values
          return [0.0, 0.0];
        }

        if (unit === 'KWH') {
          // Grid Electricity
          energy = (numericValue * 3.6) / 1000; // Convert kWh to GJ
          emissions = 0; // Convert kg CO2 to tCO2
        }

        // Replace the original array values with energy and emissions
        return [
          energy.toFixed(2), // Energy in GJ
          emissions.toFixed(2), // Emission in tCO2
        ];
      });

      throw new HttpException(
        { status: 200, message: 'Data Found', data: tmpData },
        HttpStatus.OK,
      );

    }



    const emissionData = mergedData.find(
      (item) => item.stdQuestionId === Number(questionId),
    );

    if (!emissionData) {
      throw new HttpException(
        { status: 200, message: 'Emission Data Not Found', data: null },
        HttpStatus.OK,
      );
    }

    const density = emissionData?.density || emissionData?.stdDensity;
    const calorificValue = emissionData?.calorificValue || emissionData?.stdCalorificValue;
    const emissionFactor = emissionData?.emissionFactor || emissionData?.stdEmissionFactor;

    // Convert value to standard unit
    let standardValue: number;
    let energyUnit = 'GJ'; // Default unit for energy in GJ
    let emissionUnit = 'tCO₂e'; // Default unit for emissions
    const lowerUnit = unit.toLowerCase();

    switch (lowerUnit) {
      // Petrol and Diesel Fuel Consumption
      case 'liters':
        standardValue = density ? Number(value) * density : null; // Standard is liters (for both petrol and diesel)
        break;
      case 'litres':
        standardValue = density ? Number(value) * density : null; // Standard is liters (for both petrol and diesel)
        break;
      case 'gallons':
        standardValue = Number(value) * 3.78541; // Convert gallons to liters
        break;
      case 'metric tons':
        standardValue = Number(value) * 1000; // Convert metric tons to kilograms
        break;

      // LPG, CNG, PNG Fuel Consumption
      case 'm³':
        standardValue = density ? Number(value) * density : null; // Convert m³ to kg using density
        break;
      case 'kg':
        standardValue = density ? Number(value) * density : null; // Standard is kg
        break;

      // Water Consumption and Recycling
      case 'kl': // Kiloliters
        standardValue = density ? Number(value) * density : null; // Convert kiloliters to liters
        break;
      case 'gallons':
        standardValue = Number(value) * 3.78541; // Convert gallons to liters
        break;

      // Waste Generation and Recycling
      case 'kg':
        standardValue = Number(value); // Standard is kg
        break;
      case 'metric tons':
        standardValue = Number(value) * 1000; // Convert metric tons to kilograms
        break;

      // GHG Emissions
      case 'tco2e': // Metric tons of CO₂e
        standardValue = Number(value); // Standard is metric tons of CO₂e
        break;
      case 'ktco2e': // Kilotons of CO₂e
        standardValue = Number(value) * 1000; // Convert kilotons to metric tons
        break;
      case 'mtco2e': // Megatons of CO₂e
        standardValue = Number(value) * 1_000_000; // Convert megatons to metric tons
        break;
      case 'ppm':
        standardValue = Number(value) / 1_000_000; // Convert ppm to fraction (0-1)
        break;

      // Electricity Consumption and Energy Savings
      case 'kwh': // Kilowatt-hours
        standardValue = Number(value) * 0.0036; // Convert kWh to GJ
        break;
      case 'mwh': // Megawatt-hours
        standardValue = Number(value) * 3.6; // Convert MWh to GJ
        break;
      case 'gwh': // Gigawatt-hours
        standardValue = Number(value) * 3600; // Convert GWh to GJ
        break;

      // Recycling Revenue (Currency values)
      case 'inr':
      case 'eur':
      case 'usd':
        standardValue = Number(value); // Keep currency values as is
        break;

      default:
        throw new HttpException(
          { status: 400, message: `Unsupported unit: ${unit}` },
          HttpStatus.BAD_REQUEST,
        );
    }

    // Handle density dependency for volume-based units
    if (standardValue === null && (lowerUnit === 'm³' || lowerUnit === 'kl' || lowerUnit === 'gallons')) {
      throw new HttpException(
        {
          status: 400,
          message: `Density is required for volume-based units (${unit}). Please provide valid density.`,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    // Calculate energy and emission
    const energy = calorificValue ? standardValue * calorificValue * 0.001 * 0.001 : null; // Convert MJ to GJ
    const emission = emissionFactor ? energy * emissionFactor * 0.001 * 0.001 : null;

    // Set the unit for energy and emission
    let energyData = energy ? { value: energy.toFixed(2), unit: energyUnit } : null;
    let emissionDatas = emission ? { value: emission.toFixed(2), unit: emissionUnit } : null;

    // Response data
    const responseData = {
      questionId,
      value,
      unit,
      standardValue,
      density,
      calorificValue,
      emissionFactor,
      energy: energyData,
      emission: emissionDatas,
    };

    throw new HttpException(
      { status: 200, message: 'Data Found', data: responseData },
      HttpStatus.OK,
    );
  }

  private createEmissionEntity(questionId: number, density: number, calorificValue: number, emissionFactor: number): EmissionSetting {
    return new EmissionSetting(questionId, density, calorificValue, emissionFactor);
  }
}
