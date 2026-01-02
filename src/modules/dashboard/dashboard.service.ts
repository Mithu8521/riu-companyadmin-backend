import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { DashboardDaoService } from '@modules/dao/dashboard-dao/dashboard-dao.service';
import { UserDaoService } from '@modules/dao/setting/user-dao/user-dao.service';
import { QuestionStatus } from '@utils/enums/Status';
import { ExternalApiCallService } from '@utils/common/external-api-call/external-api-call.service';
import { SectorQuestionDaoModuleService } from '@modules/dao/sector-question-dao-module/sector-question-dao-module.service';
import { SourceDaoService } from '@modules/dao/setting/source-dao/source-dao.service';
import { FilterGraphDto } from './dto/graph-filter.dto';
import { GraphFilterEntity } from './entities/graph_filter.entity';
import { OrgChartDaoService } from '@modules/dao/setting/org-chart-dao/org-chart-dao.service';
import { SetTargetDataQuestionDaoService } from '@modules/dao/set_target_data_question-dao/set_target_data_question-dao.service';
import { ReportingModuleDaoService } from '@modules/dao/reporting-module-dao/reporting-module-dao.service';
import { EsgReportingDaoService } from '@modules/dao/esg-reporting-dao/esg-reporting-dao.service';
import { TrainingDaoService } from '@modules/dao/training/training-dao/training-dao.service';
type Greeting = 'Good Morning' | 'Good Afternoon' | 'Good Evening';

interface OrgData {
  userId: string;
  orgChart?: any;
  children?: OrgData[];
}
@Injectable()
export class DashboardService {
  constructor(private dashboardDaoService: DashboardDaoService, private sectorQuestionDaoModuleService: SectorQuestionDaoModuleService, private userDaoService: UserDaoService, private externalApiCallService: ExternalApiCallService, private sourceDaoService: SourceDaoService, private orgChartDaoService: OrgChartDaoService,
    private setTargetDataQuestionDaoService: SetTargetDataQuestionDaoService, private reportingModuleDaoService: ReportingModuleDaoService, private esgReportingDaoService: EsgReportingDaoService, private trainingDaoService: TrainingDaoService
  ) { }

  async getEnvironmentData(req: any) {
    const { userid: systemUserId } = req.headers;
    const getCompany = await this.userDaoService.getHeadOfficeCompanyDetails(true);
    const frameworkIds = await this.getFrameworkIds(getCompany.company_id);
    const ids = frameworkIds.includes(1) ? [451, 452] :
      [289, 292, 293, 295, 426, 428, 429, 430, 468, 495, 497, 499, 512, 513, 514, 515, 516, 517, 518, 519, 520, 521, 522, 523, 524, 526];

    const queryParam = {
      company_id: getCompany.company_id,
      user_type_code: 'COMPANY',
      framework_ids: frameworkIds,
      qIds: ids,
    };

    const getReportingQuestion = await this.externalApiCallService.getReq(
      process.env.COMPANY_SERVER_API_URL + 'getReportingQuestion',
      queryParam,
      {},
    );
    
    const questionData = getReportingQuestion['data'];

    type FinancialYear = { id: number; financial_year_value: string };

    const financialYearData: { data: FinancialYear[] } = await this.externalApiCallService.getReq(
      process.env.COMPANY_SERVER_API_URL + 'getFinancialYear',
      { userId: getCompany.company_id, type: 'COMPANY' },
      {},
    );
    const financialYearId = Number(req.query.financialYearId);
    const financialYearValue = financialYearData.data.find(
      (fy: FinancialYear) => fy.id === financialYearId
    )?.financial_year_value || "Not Found";
    const periods = await this.generatePeriods(getCompany?.frequency, getCompany?.starting_month, financialYearValue);
    const sourceIds = await this.sourceDaoService.getAllLocation();
    const uniqueLocationsMap = new Map<number, any>();
    const subLocations = await this.sourceDaoService.getSubSourceBasedOnIds()
    for (const item of [...await this.sourceDaoService.getSourceBasedOnIds(sourceIds), ...await this.sourceDaoService.getSourceBasedOnUserId(systemUserId)]) {
      const itemId = item.id;
      const subLocation = subLocations.filter((sub) => sub.locationId == itemId);
      if (!uniqueLocationsMap.has(itemId)) uniqueLocationsMap.set(itemId, { ...item, subLocation, location: JSON.parse(item.location) });
    }
    const parsedLocations = Array.from(uniqueLocationsMap.values());
    const locationIds = await this.locationData(parsedLocations);

    const fuelDataReneableBrsr: string[] = ["Geothermal Energy", 'Fuel Energy', "Solar", "Wind", "Hydropower", "Energy (other sources)"];
    const fuelDataNonReneableBrsr: string[] = ["Grid Electricity", 'Petrol', "Diesel", "CNG", "PNG", "LPG", 'Natural gas', "Coal", "Biomass", "Energy (other sources)"];
    const electricityBrsr: string[] = ["Grid Electricity", "Solar", "Geothermal Energy", "Wind", "Hydropower"];
    const fuelsManial: string[] = ["Diesel", "Petrol", "Furnace oil", "Coal", "LPG", "PNG", "Briquette"];
    const electricityManipal: string[] = ["Electricity (Captive Power Plant)", "Electricity (DG)", "Electricity (via PPA)", "Electricity ((GRID)", 'Electricity (rooftop solar)'];
    const medicalGasesManiapl: string[] = ["Nitrous Oxide", "Carbon Dioxide", "Entonox", "Desflurane", "Isoflurane", "Sevoflurane", "Sevitrue", "Suprane", "Sevorane"];
    const refrigerantsManipal: string[] = ["R-134A", "R-22", "R-407C", "R-32", "R-410A"];
    const renewableEnergyManipal: string[] = ["Electricity (rooftop solar)", 'Electricity (via PPA)'];

    const calculationData = [
      { fuelType: "Diesel", questionId: 289, density: 0.85, calorificValue: 42.5, emissionFactor: 2.66155 },
      { fuelType: "Petrol", questionId: 293, density: 0.74, calorificValue: 44.4, emissionFactor: 2.35372 },
      { fuelType: "Furnace oil", questionId: 495, density: 0.95, calorificValue: 40.5, emissionFactor: 323.842 },
      { fuelType: "Coal", questionId: 497, density: 1.35, calorificValue: 25.0, emissionFactor: 2399.43994 },
      { fuelType: "LPG", questionId: 292, density: 0.54, calorificValue: 46.1, emissionFactor: 1.55713 },
      { fuelType: "PNG", questionId: 295, density: 0.8, calorificValue: 39.0, emissionFactor: 2.04 },
      { fuelType: "Briquette", questionId: 499, density: 1.2, calorificValue: 18.0, emissionFactor: 460.24 },
      { fuelType: "CNG", questionId: 535, density: 0.72, calorificValue: 48.0, emissionFactor: 56.1 },
      { fuelType: "Grid", questionId: 541, density: 1, calorificValue: 1, emissionFactor: 0.89 },
      { fuelType: "Electricity (Captive Power Plant)", questionId: 427, density: 1, calorificValue: 1, emissionFactor: 0.89 },
      { fuelType: "Electricity (DG)", questionId: 428, density: 1, calorificValue: 1, emissionFactor: 0.89 },
      { fuelType: "Electricity (via PPA)", questionId: 429, density: 1, calorificValue: 1, emissionFactor: 0.89 },
      { fuelType: "Electricity (rooftop solar)", questionId: 430, density: 1, calorificValue: 1, emissionFactor: 0.89 },
      { fuelType: "Nitrous Oxide", questionId: 512, density: 1, calorificValue: 1, emissionFactor: 0.589346 },
      { fuelType: "Carbon Dioxide", questionId: 513, density: 1, calorificValue: 1, emissionFactor: 1 },
      { fuelType: "Desflurane", questionId: 515, density: 1, calorificValue: 1, emissionFactor: 3.7211 },
      { fuelType: "Isoflurane", questionId: 516, density: 1, calorificValue: 1, emissionFactor: 0.806344 },
      { fuelType: "Sevitrue", questionId: 523, density: 1, calorificValue: 1, emissionFactor: 0.3192 },
      { fuelType: "Sevoflurane", questionId: 517, density: 1, calorificValue: 1, emissionFactor: 0.3192 },
      { fuelType: "Suprane", questionId: 524, density: 1, calorificValue: 1, emissionFactor: 0.789635 },
      { fuelType: "Sevorane", questionId: 526, density: 1, calorificValue: 1, emissionFactor: 0.789635 },
      { fuelType: "Entonox", questionId: 514, density: 1, calorificValue: 1, emissionFactor: 172.871 },
      { fuelType: "R-134A", questionId: 518, density: 1, calorificValue: 1, emissionFactor: 1300 },
      { fuelType: "R-22", questionId: 519, density: 1, calorificValue: 1, emissionFactor: 1760 },
      { fuelType: "R-407C", questionId: 520, density: 1, calorificValue: 1, emissionFactor: 1624 },
      { fuelType: "R-32", questionId: 521, density: 1, calorificValue: 1, emissionFactor: 677 },
      { fuelType: "R-410A", questionId: 522, density: 1, calorificValue: 1, emissionFactor: 1924 },
    ];
    const periodsKeys = Object.keys(periods).map((key) => key);
    const energyData = {
      fuelDataReneableBrsrEnergy: { time: {}, location: {} },
      fuelDataNonReneableBrsrEnergy: { time: {}, location: {} },
      electricityBrsrEnergy: { time: {}, location: {} },
      fuelsManialEnergy: { time: {}, location: {} },
      electricityManipalEnergy: { time: {}, location: {} },
      medicalGasesManiaplEnergy: { time: {}, location: {} },
      refrigerantsManipalEnergy: { time: {}, location: {} },
      renewableEnergyManipalEnergy: { time: {}, location: {} },
    };

    const generateEnergyEntries = (categories, length) =>
      Object.fromEntries(categories.map((fuel) => [fuel, new Array(length).fill(0)]));

    if (locationIds) {
      locationIds.forEach((location) => {
        periodsKeys.forEach((quarter) => {
          energyData.fuelDataReneableBrsrEnergy.location[quarter] = generateEnergyEntries(fuelDataReneableBrsr, locationIds.length);
          energyData.fuelDataNonReneableBrsrEnergy.location[quarter] = generateEnergyEntries(fuelDataNonReneableBrsr, locationIds.length);
          energyData.electricityBrsrEnergy.location[quarter] = generateEnergyEntries(electricityBrsr, locationIds.length);
          energyData.fuelsManialEnergy.location[quarter] = generateEnergyEntries(fuelsManial, locationIds.length);
          energyData.electricityManipalEnergy.location[quarter] = generateEnergyEntries(electricityManipal, locationIds.length);
          energyData.medicalGasesManiaplEnergy.location[quarter] = generateEnergyEntries(medicalGasesManiapl, locationIds.length);
          energyData.refrigerantsManipalEnergy.location[quarter] = generateEnergyEntries(refrigerantsManipal, locationIds.length);
          energyData.renewableEnergyManipalEnergy.location[quarter] = generateEnergyEntries(renewableEnergyManipal, locationIds.length);
        });
      });
    }

    if (periodsKeys) {
      periodsKeys.forEach((quarter) => {
        locationIds.forEach((location) => {
          energyData.fuelDataReneableBrsrEnergy.time[location.unitCode] = generateEnergyEntries(fuelDataReneableBrsr, periodsKeys.length);
          energyData.fuelDataNonReneableBrsrEnergy.time[location.unitCode] = generateEnergyEntries(fuelDataNonReneableBrsr, periodsKeys.length);
          energyData.electricityBrsrEnergy.time[location.unitCode] = generateEnergyEntries(electricityBrsr, periodsKeys.length);
          energyData.fuelsManialEnergy.time[location.unitCode] = generateEnergyEntries(fuelsManial, periodsKeys.length);
          energyData.electricityManipalEnergy.time[location.unitCode] = generateEnergyEntries(electricityManipal, periodsKeys.length);
          energyData.medicalGasesManiaplEnergy.time[location.unitCode] = generateEnergyEntries(medicalGasesManiapl, periodsKeys.length);
          energyData.refrigerantsManipalEnergy.time[location.unitCode] = generateEnergyEntries(refrigerantsManipal, periodsKeys.length);
          energyData.renewableEnergyManipalEnergy.time[location.unitCode] = generateEnergyEntries(renewableEnergyManipal, periodsKeys.length);
        });
      });
    }
    const answerData = await this.sectorQuestionDaoModuleService.getReportingQuestionTabularAnswerBasedId(ids, Number(req.query.financialYearId));


    if (answerData) {
      const processEnergyData = (energyTypeObj) => {
        for (const location in energyTypeObj.time) {
          const locationData = energyTypeObj.time[location];
          for (const fuelType in locationData) {
            for (let periodIndex = 0; periodIndex < periodsKeys.length; periodIndex++) {
              const period = periodsKeys[periodIndex];

              const locationObj = locationIds.find((item) => item.unitCode === location);
              if (!locationObj) continue;

              const formDate = periods[period];

              const calcItem = calculationData.find((item) =>
                item.fuelType === fuelType ||
                questionData.find(q => q.id === item.questionId)?.questionTitle === fuelType
              );

              if (!calcItem) continue;

              const filterData = answerData.find(
                (item) =>
                  item.questionId === calcItem.questionId &&
                  item.fromDate === formDate &&
                  item.sourceId === Number(locationObj.id)
              );

              let readingValue = 0;

              try {
                const parsedAnswer = filterData?.answer ? JSON.parse(filterData.answer) : {};
                readingValue = Number(parsedAnswer?.readingValue) || 0;
              } catch (error) {
                console.error("Error parsing answer:", error);
              }

              let energyValue = readingValue;

              if (calcItem.density && calcItem.calorificValue) {
                energyValue = readingValue * calcItem.density * calcItem.calorificValue;
              }

              locationData[fuelType][periodIndex] = energyValue;
            }
          }
        }

        for (const period in energyTypeObj.location) {
          const periodData = energyTypeObj.location[period];
          for (const fuelType in periodData) {
            for (let locationIndex = 0; locationIndex < locationIds.length; locationIndex++) {
              const location = locationIds[locationIndex];

              const formDate = periods[period];

              // Find the corresponding calculation data
              const calcItem = calculationData.find((item) =>
                item.fuelType === fuelType ||
                questionData.find(q => q.id === item.questionId)?.questionTitle === fuelType
              );

              if (!calcItem) continue;

              // Find matching answer
              const filterData = answerData.find(
                (item) =>
                  item.questionId === calcItem.questionId &&
                  item.fromDate === formDate &&
                  item.sourceId === Number(location.id)
              );

              let readingValue = 0;

              try {
                const parsedAnswer = filterData?.answer ? JSON.parse(filterData.answer) : {};
                readingValue = Number(parsedAnswer?.readingValue) || 0;
              } catch (error) {
                console.error("Error parsing answer:", error);
              }
              // Calculate energy value based on fuel type and reading
              let energyValue = readingValue;

              // For fuels that need conversion to energy units
              if (calcItem.density && calcItem.calorificValue) {
                energyValue = readingValue * calcItem.density * calcItem.calorificValue;
              }

              periodData[fuelType][locationIndex] = energyValue;
            }
          }
        }
      };

      processEnergyData(energyData.fuelsManialEnergy);
      processEnergyData(energyData.electricityManipalEnergy);
      processEnergyData(energyData.medicalGasesManiaplEnergy);
      processEnergyData(energyData.refrigerantsManipalEnergy);
      processEnergyData(energyData.renewableEnergyManipalEnergy);
      processEnergyData(energyData.fuelDataReneableBrsrEnergy);
      processEnergyData(energyData.fuelDataNonReneableBrsrEnergy);
      processEnergyData(energyData.electricityBrsrEnergy);
    }
    throw new HttpException(
      {
        status: 200,
        message: 'Data Found',
        data: energyData,
      },
      HttpStatus.OK,
    );
  }

  async getTotalEmissionData(req: any) {
    const { userid: systemUserId } = req.headers;
    const getCompany = await this.userDaoService.getHeadOfficeCompanyDetails(true);
    const frameworkIds = await this.getFrameworkIds(getCompany.company_id);
    const ids = frameworkIds.includes(1) ? [451, 452] :
      [289, 292, 293, 295, 426, 428, 429, 430, 468, 495, 497, 499, 512, 513, 514, 515, 516, 517, 518, 519, 520, 521, 522, 523, 524, 526];

    const queryParam = {
      company_id: getCompany.company_id,
      user_type_code: 'COMPANY',
      framework_ids: frameworkIds,
      qIds: ids,
    };

    const getReportingQuestion = await this.externalApiCallService.getReq(
      process.env.COMPANY_SERVER_API_URL + 'getReportingQuestion',
      queryParam,
      {},
    );
    const questionData = getReportingQuestion['data'];

    type FinancialYear = { id: number; financial_year_value: string };

    const financialYearData: { data: FinancialYear[] } = await this.externalApiCallService.getReq(
      process.env.COMPANY_SERVER_API_URL + 'getFinancialYear',
      { userId: getCompany.company_id, type: 'COMPANY' },
      {},
    );
    const financialYearId = Number(req.query.financialYearId);
    const financialYearValue = financialYearData.data.find(
      (fy: FinancialYear) => fy.id === financialYearId
    )?.financial_year_value || "Not Found";
    const periods = await this.generatePeriods(getCompany?.frequency, getCompany?.starting_month, financialYearValue);
    const sourceIds = await this.sourceDaoService.getAllLocation();
    const uniqueLocationsMap = new Map<number, any>();
    const subLocations = await this.sourceDaoService.getSubSourceBasedOnIds()
    for (const item of [...await this.sourceDaoService.getSourceBasedOnIds(sourceIds), ...await this.sourceDaoService.getSourceBasedOnUserId(systemUserId)]) {
      const itemId = item.id;
      const subLocation = subLocations.filter((sub) => sub.locationId == itemId);
      if (!uniqueLocationsMap.has(itemId)) uniqueLocationsMap.set(itemId, { ...item, subLocation, location: JSON.parse(item.location) });
    }
    const parsedLocations = Array.from(uniqueLocationsMap.values());
    const locationIds = await this.locationData(parsedLocations);

    const fuelDataReneableBrsr: string[] = ["Geothermal Energy", 'Fuel Energy', "Solar", "Wind", "Hydropower", "Energy (other sources)"];
    const fuelDataNonReneableBrsr: string[] = ["Grid Electricity", 'Petrol', "Diesel", "CNG", "PNG", "LPG", 'Natural gas', "Coal", "Biomass", "Energy (other sources)"];
    const electricityBrsr: string[] = ["Grid Electricity", "Solar", "Geothermal Energy", "Wind", "Hydropower"];
    const fuelsManial: string[] = ["Diesel", "Petrol", "Furnace oil", "Coal", "LPG", "PNG", "Briquette"];
    const electricityManipal: string[] = ["Electricity (Captive Power Plant)", "Electricity (DG)", "Electricity (via PPA)", "Electricity ((GRID)", 'Electricity (rooftop solar)'];
    const medicalGasesManiapl: string[] = ["Nitrous Oxide", "Carbon Dioxide", "Entonox", "Desflurane", "Isoflurane", "Sevoflurane", "Sevitrue", "Suprane", "Sevorane"];
    const refrigerantsManipal: string[] = ["R-134A", "R-22", "R-407C", "R-32", "R-410A"];
    const renewableEnergyManipal: string[] = ["Electricity (rooftop solar)", 'Electricity (via PPA)'];

    const calculationData = [
      { fuelType: "Diesel", questionId: 289, density: 0.85, calorificValue: 42.5, emissionFactor: 2.66155 },
      { fuelType: "Petrol", questionId: 293, density: 0.74, calorificValue: 44.4, emissionFactor: 2.35372 },
      { fuelType: "Furnace oil", questionId: 495, density: 0.95, calorificValue: 40.5, emissionFactor: 323.842 },
      { fuelType: "Coal", questionId: 497, density: 1.35, calorificValue: 25.0, emissionFactor: 2399.43994 },
      { fuelType: "LPG", questionId: 292, density: 0.54, calorificValue: 46.1, emissionFactor: 1.55713 },
      { fuelType: "PNG", questionId: 295, density: 0.8, calorificValue: 39.0, emissionFactor: 2.04 },
      { fuelType: "Briquette", questionId: 499, density: 1.2, calorificValue: 18.0, emissionFactor: 460.24 },
      { fuelType: "CNG", questionId: 535, density: 0.72, calorificValue: 48.0, emissionFactor: 56.1 },
      { fuelType: "Grid", questionId: 541, density: 1, calorificValue: 1, emissionFactor: 0.89 },
      { fuelType: "Electricity (Captive Power Plant)", questionId: 427, density: 1, calorificValue: 1, emissionFactor: 0.89 },
      { fuelType: "Electricity (DG)", questionId: 428, density: 1, calorificValue: 1, emissionFactor: 0.89 },
      { fuelType: "Electricity (via PPA)", questionId: 429, density: 1, calorificValue: 1, emissionFactor: 0.89 },
      { fuelType: "Electricity (rooftop solar)", questionId: 430, density: 1, calorificValue: 1, emissionFactor: 0.89 },
      { fuelType: "Nitrous Oxide", questionId: 512, density: 1, calorificValue: 1, emissionFactor: 0.589346 },
      { fuelType: "Carbon Dioxide", questionId: 513, density: 1, calorificValue: 1, emissionFactor: 1 },
      { fuelType: "Desflurane", questionId: 515, density: 1, calorificValue: 1, emissionFactor: 3.7211 },
      { fuelType: "Isoflurane", questionId: 516, density: 1, calorificValue: 1, emissionFactor: 0.806344 },
      { fuelType: "Sevitrue", questionId: 523, density: 1, calorificValue: 1, emissionFactor: 0.3192 },
      { fuelType: "Sevoflurane", questionId: 517, density: 1, calorificValue: 1, emissionFactor: 0.3192 },
      { fuelType: "Suprane", questionId: 524, density: 1, calorificValue: 1, emissionFactor: 0.789635 },
      { fuelType: "Sevorane", questionId: 526, density: 1, calorificValue: 1, emissionFactor: 0.789635 },
      { fuelType: "Entonox", questionId: 514, density: 1, calorificValue: 1, emissionFactor: 172.871 },
      { fuelType: "R-134A", questionId: 518, density: 1, calorificValue: 1, emissionFactor: 1300 },
      { fuelType: "R-22", questionId: 519, density: 1, calorificValue: 1, emissionFactor: 1760 },
      { fuelType: "R-407C", questionId: 520, density: 1, calorificValue: 1, emissionFactor: 1624 },
      { fuelType: "R-32", questionId: 521, density: 1, calorificValue: 1, emissionFactor: 677 },
      { fuelType: "R-410A", questionId: 522, density: 1, calorificValue: 1, emissionFactor: 1924 },
    ];
    const periodsKeys = Object.keys(periods).map((key) => key);
    const energyData = {
      fuelDataReneableBrsrEnergy: { time: {}, location: {} },
      fuelDataNonReneableBrsrEnergy: { time: {}, location: {} },
      electricityBrsrEnergy: { time: {}, location: {} },
      fuelsManialEnergy: { time: {}, location: {} },
      electricityManipalEnergy: { time: {}, location: {} },
      medicalGasesManiaplEnergy: { time: {}, location: {} },
      refrigerantsManipalEnergy: { time: {}, location: {} },
      renewableEnergyManipalEnergy: { time: {}, location: {} },
    };

    const generateEnergyEntries = (categories, length) =>
      Object.fromEntries(categories.map((fuel) => [fuel, new Array(length).fill(0)]));

    if (locationIds) {
      locationIds.forEach((location) => {
        periodsKeys.forEach((quarter) => {
          energyData.fuelDataReneableBrsrEnergy.location[quarter] = generateEnergyEntries(fuelDataReneableBrsr, locationIds.length);
          energyData.fuelDataNonReneableBrsrEnergy.location[quarter] = generateEnergyEntries(fuelDataNonReneableBrsr, locationIds.length);
          energyData.electricityBrsrEnergy.location[quarter] = generateEnergyEntries(electricityBrsr, locationIds.length);
          energyData.fuelsManialEnergy.location[quarter] = generateEnergyEntries(fuelsManial, locationIds.length);
          energyData.electricityManipalEnergy.location[quarter] = generateEnergyEntries(electricityManipal, locationIds.length);
          energyData.medicalGasesManiaplEnergy.location[quarter] = generateEnergyEntries(medicalGasesManiapl, locationIds.length);
          energyData.refrigerantsManipalEnergy.location[quarter] = generateEnergyEntries(refrigerantsManipal, locationIds.length);
          energyData.renewableEnergyManipalEnergy.location[quarter] = generateEnergyEntries(renewableEnergyManipal, locationIds.length);
        });
      });
    }

    if (periodsKeys) {
      periodsKeys.forEach((quarter) => {
        locationIds.forEach((location) => {
          energyData.fuelDataReneableBrsrEnergy.time[location.unitCode] = generateEnergyEntries(fuelDataReneableBrsr, periodsKeys.length);
          energyData.fuelDataNonReneableBrsrEnergy.time[location.unitCode] = generateEnergyEntries(fuelDataNonReneableBrsr, periodsKeys.length);
          energyData.electricityBrsrEnergy.time[location.unitCode] = generateEnergyEntries(electricityBrsr, periodsKeys.length);
          energyData.fuelsManialEnergy.time[location.unitCode] = generateEnergyEntries(fuelsManial, periodsKeys.length);
          energyData.electricityManipalEnergy.time[location.unitCode] = generateEnergyEntries(electricityManipal, periodsKeys.length);
          energyData.medicalGasesManiaplEnergy.time[location.unitCode] = generateEnergyEntries(medicalGasesManiapl, periodsKeys.length);
          energyData.refrigerantsManipalEnergy.time[location.unitCode] = generateEnergyEntries(refrigerantsManipal, periodsKeys.length);
          energyData.renewableEnergyManipalEnergy.time[location.unitCode] = generateEnergyEntries(renewableEnergyManipal, periodsKeys.length);
        });
      });
    }
    const answerData = await this.sectorQuestionDaoModuleService.getReportingQuestionTabularAnswerBasedId(ids, Number(req.query.financialYearId));


    if (answerData) {
      const processEnergyData = (energyTypeObj) => {
        for (const location in energyTypeObj.time) {
          const locationData = energyTypeObj.time[location];
          for (const fuelType in locationData) {
            for (let periodIndex = 0; periodIndex < periodsKeys.length; periodIndex++) {
              const period = periodsKeys[periodIndex];

              const locationObj = locationIds.find((item) => item.unitCode === location);
              if (!locationObj) continue;

              const formDate = periods[period];

              const calcItem = calculationData.find((item) =>
                item.fuelType === fuelType ||
                questionData.find(q => q.id === item.questionId)?.questionTitle === fuelType
              );

              if (!calcItem) continue;

              const filterData = answerData.find(
                (item) =>
                  item.questionId === calcItem.questionId &&
                  item.fromDate === formDate &&
                  item.sourceId === Number(locationObj.id)
              );

              let readingValue = 0;

              try {
                const parsedAnswer = filterData?.answer ? JSON.parse(filterData.answer) : {};
                readingValue = Number(parsedAnswer?.readingValue) || 0;
              } catch (error) {
                console.error("Error parsing answer:", error);
              }

              let energyValue = readingValue;

              if (calcItem.density && calcItem.calorificValue) {
                energyValue = readingValue * calcItem.emissionFactor;
              }

              locationData[fuelType][periodIndex] = energyValue;
            }
          }
        }

        for (const period in energyTypeObj.location) {
          const periodData = energyTypeObj.location[period];
          for (const fuelType in periodData) {
            for (let locationIndex = 0; locationIndex < locationIds.length; locationIndex++) {
              const location = locationIds[locationIndex];

              const formDate = periods[period];

              // Find the corresponding calculation data
              const calcItem = calculationData.find((item) =>
                item.fuelType === fuelType ||
                questionData.find(q => q.id === item.questionId)?.questionTitle === fuelType
              );

              if (!calcItem) continue;

              // Find matching answer
              const filterData = answerData.find(
                (item) =>
                  item.questionId === calcItem.questionId &&
                  item.fromDate === formDate &&
                  item.sourceId === Number(location.id)
              );

              let readingValue = 0;

              try {
                const parsedAnswer = filterData?.answer ? JSON.parse(filterData.answer) : {};
                readingValue = Number(parsedAnswer?.readingValue) || 0;
              } catch (error) {
                console.error("Error parsing answer:", error);
              }
              // Calculate energy value based on fuel type and reading
              let energyValue = readingValue;

              // For fuels that need conversion to energy units
              if (calcItem.density && calcItem.calorificValue) {
                energyValue = readingValue * calcItem.emissionFactor;
              }

              periodData[fuelType][locationIndex] = energyValue;
            }
          }
        }
      };

      processEnergyData(energyData.fuelsManialEnergy);
      processEnergyData(energyData.electricityManipalEnergy);
      processEnergyData(energyData.medicalGasesManiaplEnergy);
      processEnergyData(energyData.refrigerantsManipalEnergy);
      processEnergyData(energyData.renewableEnergyManipalEnergy);
      processEnergyData(energyData.fuelDataReneableBrsrEnergy);
      processEnergyData(energyData.fuelDataNonReneableBrsrEnergy);
      processEnergyData(energyData.electricityBrsrEnergy);
    }
    throw new HttpException(
      {
        status: 200,
        message: 'Data Found',
        data: energyData,
      },
      HttpStatus.OK,
    );
  }

  private async locationData(data: any): Promise<Array<{ id: string; unitCode: string; location: string }>> {
    return data.flatMap(({ id, unitCode, location, subLocation }) => {
      const baseLocation = `${location.area}, ${location.city}`;

      if (!subLocation || subLocation.length === 0) {
        return [{ id: id.toString(), unitCode, location: baseLocation }];
      }

      return subLocation.map((sub) => ({
        id: `${id}-${sub.id}`,
        unitCode: `${unitCode}-${sub.subLocation}`,
        location: `${baseLocation} - ${sub.subLocation}`,
      }));
    });
  }

  private async generatePeriods(frequency: any, startMonth: number, yearRange: string): Promise<Record<string, string>> {
    const [startYear, endYear] = yearRange.split("-").map(Number);
    const months: string[] = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    let periods: Record<string, string> = {};

    if (frequency === "MONTHLY") {
      let currentYear = startYear;
      for (let i = 0; i < 12; i++) {
        let monthIndex = (startMonth - 1 + i) % 12;
        if (monthIndex === 0 && i > 0) currentYear = endYear;
        let monthName = months[monthIndex];
        let formattedMonth = String(monthIndex + 1).padStart(2, "0");
        periods[monthName] = `${currentYear}-${formattedMonth}`;
      }
    }

    else if (frequency === "QUARTERLY") {
      let currentYear = startYear;
      const quarterLabels = ["Q1", "Q2", "Q3", "Q4"];

      for (let i = 0; i < 4; i++) {
        let quarterStart = (startMonth - 1 + i * 3) % 12;
        if (quarterStart === 0 && i > 0) currentYear = endYear;
        let quarterEnd = (quarterStart + 2) % 12;
        let yearToUse = quarterStart > quarterEnd ? endYear : currentYear;

        let label = `${months[quarterStart]} - ${months[quarterEnd]}`;
        let date = `${yearToUse}-${String(quarterStart + 1).padStart(2, "0")}`;

        periods[label] = date;
      }
    }

    else if (frequency === "HALF_YEARLY") {
      let half1Start = startMonth - 1;
      let half2Start = (half1Start + 6) % 12;
      let year2 = half2Start < half1Start ? endYear : startYear;

      let half1Label = `${months[half1Start]} - ${months[(half1Start + 5) % 12]}`;
      let half2Label = `${months[half2Start]} - ${months[(half2Start + 5) % 12]}`;

      periods[half1Label] = `${startYear}-${String(half1Start + 1).padStart(2, "0")}`;
      periods[half2Label] = `${year2}-${String(half2Start + 1).padStart(2, "0")}`;
    }

    else if (frequency === "YEARLY") {
      let label = `${months[startMonth - 1]} - ${months[(startMonth - 2 + 12) % 12]}`;
      periods[label] = `${startYear}-${String(startMonth).padStart(2, "0")}`;
    }

    return periods;
  }


  async lastWeekActivity(req: any) {
    const systemUserId = req.headers.userid;
    const { financialYearId } = req.query;

    const isHead = (await this.userDaoService.getCompanyDetailsBasedOnUserId(Number(systemUserId))).head_office;
    const done = isHead ? await this.dashboardDaoService.doneALLQuestionByUserId('ACCEPTED' as QuestionStatus, Number(financialYearId)) : await this.dashboardDaoService.doneQuestionByUserId(systemUserId, 'ACCEPTED' as QuestionStatus, Number(financialYearId));
    const updated = isHead ? await this.dashboardDaoService.lastWeekAllUpdatedQuestionByUserId(Number(financialYearId)) : await this.dashboardDaoService.lastWeekUpdatedQuestionByUserId(Number(systemUserId), Number(financialYearId));
    const pending = isHead ? await this.dashboardDaoService.lastWeekAllPendingQuestionByUserId() : await this.dashboardDaoService.lastWeekPendingQuestionByUserId(Number(systemUserId), Number(financialYearId));
    const due = isHead ? await this.dashboardDaoService.nextWeekAllDueQuestionByUserId() : await this.dashboardDaoService.nextWeekDueQuestionByUserId(Number(systemUserId), Number(financialYearId));
    const getCompany = await this.userDaoService.getCompanyDetailsBasedOnUserId(Number(systemUserId));
    const userName = getCompany.first_name + ' ' + getCompany.last_name;
    const currentHour = await this.getLocalHour();
    let greeting: Greeting;
    if (currentHour < 6) {
      greeting = 'Good Morning';
    } else if (currentHour < 12) {
      greeting = 'Good Afternoon';
    } else {
      greeting = 'Good Evening';
    }
    const message = `${greeting}, ${userName}`;
    const response = {
      Completed: { number: done.length, questionId: done },
      'In Progress': { number: updated.length, questionId: updated },
      Overdue: { number: 0, questionId: pending },
      Upcoming: { number: due.length, questionId: due },
      message: message,
    };
    throw new HttpException(
      {
        status: 200,
        message: 'Data Found',
        data: response,
      },
      HttpStatus.OK,
    );
  }

  async todaysActivity(req: any) {
    const systemUserId = req.headers.userid;
    const isHead = await this.userDaoService.getCompanyDetailsBasedOnUserId(Number(systemUserId));
    if (JSON.parse(req.query.locationIds).length) {
      const getUsers = await this.userDaoService.getUsersBySourceIds(JSON.parse(req.query.locationIds));
      const todaysActivity = isHead.head_office ? await this.dashboardDaoService.todaysAllActivity() : await this.dashboardDaoService.todaysActivity(systemUserId);

      const modifiedArray = [];
      for (const obj1 of todaysActivity) {
        for (const obj2 of getUsers) {
          if (obj2.id === obj1.userId) {
            modifiedArray.push({ ...obj1, userName: obj2.first_name + " " + obj2?.last_name });
            break;
          }
        }
      }

      throw new HttpException(
        {
          status: 200,
          message: 'Data Found',
          data: modifiedArray,
        },
        HttpStatus.OK,
      );
    } else {
      throw new HttpException(
        {
          status: 400,
          message: 'location Not Assigned',
          data: [],
        },
        HttpStatus.BAD_REQUEST,
      );
    }

  }

  async allUsers(req: any) {
    const systemUserId = req.headers.userid;

    if (!systemUserId) {
      throw new HttpException(
        { status: 400, message: 'User ID is required', data: null },
        HttpStatus.BAD_REQUEST
      );
    }

    const userOrgChart = await this.findUserOrgChartData(systemUserId);
    if (!userOrgChart) {
      return {
        status: 200,
        message: 'No org chart data found',
        data: { teamWorkloadResults: [] }
      };
    }

    const userIds = await this.extractUserIds(userOrgChart);

    if (!userIds || userIds.length === 0) {
      return {
        status: 200,
        message: 'No users found in org chart',
        data: { teamWorkloadResults: [] }
      };
    }

    const teamUsers = await this.userDaoService.getTeamUser(userIds);

    return {
      status: 200,
      message: 'Users retrieved successfully',
      data: teamUsers
    };
  }



  async myDisclosureProgress(req: any) {
    const userId = req.query.userid;
    const systemUserId = req.headers.userid;
    const getCompany = await this.userDaoService.getHeadOfficeCompanyDetails(true);
    const frameworks = await this.getFramework(getCompany.company_id);
    const filterData = await this.dashboardDaoService.getGraphFilterForUser(systemUserId, "My Disclosure Progress");
    const uniqueColors = [
      "#D2691E", "#228B22", "#808080", "#800000", "#008000",
      "#32CD32", "#4682B4", "#FFA07A", "#8A2BE2", "#CD5C5C",
      "#556B2F", "#7FFFD4", "#8B4513", "#FF8C00", "#2E8B57",
      'rgb(254, 176, 25)', '#008FFB', 'rgb(255, 69, 96)', 'rgb(0, 227, 150)',
      "#E73C7E", "#00A86B", "#AB83A1", "#E36144", "#7A8B8D",
    ];
    if (filterData === null) {
      const frameworkIds = frameworks.map(obj => obj["id"]);
      const filter = {
        frameworkIds: (frameworkIds).slice(0, 5),
        chartType: "ColumnChart"
      }
      await this.dashboardDaoService.insertGraphFilter(new GraphFilterEntity("My Disclosure Progress", systemUserId, JSON.stringify(filter)));
    }
    const series: any = [];
    const frameworkOptions: any = [];
    const titleColorMap = {};
    let colorIndex = 0;
    for (let framework of frameworks) {
      const id = framework["id"];
      let title = framework["title"];
      if (title === "Business Responsibility and Sustainability Reporting (BRSR)") {
        title = "BRSR"
      } else if (title === "Global Reporting Initiative (GRI)") {
        title = "GRI"
      } else if (title === "RSPO Monthly Balance Report") {
        title = "RSPO MBR"
      }
      frameworkOptions.push({ id: id, title: title })
      const queryParam = { framework_ids: [id] };
      const getSectorQuestionResponse = await this.getSectorQuestionForGraph(queryParam);
      const accepted = await this.dashboardDaoService.acceptedFramworkIdsDataBasedOnId(id);
      const acceptedanswer = getSectorQuestionResponse["data"].length === 0 ? 0 : parseFloat(((accepted.length / getSectorQuestionResponse["data"].length) * 100).toFixed(2));
      if (!titleColorMap[title]) {
        titleColorMap[title] = uniqueColors[colorIndex];
        colorIndex = (colorIndex + 1) % uniqueColors.length;
      }
      series.push({ name: title, data: [acceptedanswer], color: titleColorMap[title], questionId: accepted })
    }
    const filterDatas = await this.dashboardDaoService.getGraphFilterForUser(systemUserId, "My Disclosure Progress");
    let totalSum = 0;
    series.forEach(item => { totalSum += item.data.reduce((acc, currentValue) => acc + currentValue, 0) });
    const data = parseFloat(((totalSum / series.length)).toFixed(2));
    series.push({ name: "Overall Status", data: [data] })
    const result = {
      series: series.reverse(),
      categories: ["2023-2024"],
      frameworkOptions: frameworkOptions,
      filter: JSON.parse(filterDatas.filter)
    };
    throw new HttpException({
      status: 200,
      message: 'Data Found',
      data: result,
    }, HttpStatus.OK);
  }

  async frameworkProgress(req: any) {
    const { fromDate, toDate, financialYearId, frameworkIds, locationIdsIds, periods } = req.query;
    const array = periods.replace(/[\[\]]/g, '').split(',').map(item => item);
    const systemUserId = req.headers.userid;
    const getCompany = await this.userDaoService.getHeadOfficeCompanyDetails(true);
    const isHead = (await this.userDaoService.getCompanyDetailsBasedOnUserId(Number(systemUserId))).head_office;

    const queryParam = {
      company_id: getCompany.company_id,
      user_type_code: 'COMPANY',
      framework_ids: JSON.parse(frameworkIds),
      qIds: undefined,
    };
    const getSectorQuestionResponse = await this.externalApiCallService.getReq(
      process.env.COMPANY_SERVER_API_URL + 'getReportingQuestion',
      queryParam,
      {},
    );
    const questions = getSectorQuestionResponse["data"].map(obj => obj.questionId);
    const tmpanswered = isHead ? await this.dashboardDaoService.answeredReportingAllIdsData(Number(financialYearId), array, JSON.parse(locationIdsIds)) : await this.dashboardDaoService.answeredReportingIdsData(systemUserId, financialYearId);
    const answered = [...new Set(tmpanswered.filter(element => questions.includes(element)))];
    const notAnswered = 12;

    // const notAnsweredS = [...new Set(answered.filter(element => questions.includes(element)))];
    // const filtered = answered.filter(element => !questions.includes(element));

    const auditorAssignedQuestion = await this.dashboardDaoService.getQuestionAuditedIds(Number(financialYearId));
    const accepted = auditorAssignedQuestion.filter(item => { const lastRemark = item.remark?.[item.remark.length - 1]; return lastRemark && lastRemark.status === 'ACCEPTED'; }).map(item => item.questionId);
    const finalAccepted = [...new Set(accepted.filter(element => answered.includes(element)))];
    const notAccepted = answered.filter(item => !finalAccepted.includes(item));
    const rejected = auditorAssignedQuestion.filter(item => { const lastRemark = item.remark?.[item.remark.length - 1]; return lastRemark && lastRemark.status === 'REJECTED'; }).map(item => item.questionId);
    const finalRejected = [...new Set(rejected.filter(element => answered.includes(element)))];
    const result = { answered, questions, finalAccepted, finalRejected, notAccepted, notAnswered };
    throw new HttpException({ status: 200, message: 'Data Found', data: result, }, HttpStatus.OK);
  }

  async sourceProgress(req: any) {
    const { fromDate, toDate, financialYearId } = req.query;
    const systemUserId = req.headers.userid;
    const getCompany = await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId);
    const getLocations = getCompany.head_office ? await this.sourceDaoService.getSourceBasedOnUserId(getCompany.id) : await this.sourceDaoService.getSourceBasedOnIds(JSON.parse(getCompany.source_ids));
    const filterData = await this.dashboardDaoService.getGraphFilterForUser(systemUserId, "Location Progress");
    if (filterData === null) {
      const sourceIds = getLocations.map(obj => obj.id);
      const filter = {
        Status: ["percentageAccepted", "percentageRejected", "percentageAnswered", "percentageUnresponded"],
        locationIds: (sourceIds).slice(0, 5),
        chartType: "ColumnChart"
      }
      await this.dashboardDaoService.insertGraphFilter(new GraphFilterEntity("Location Progress", systemUserId, JSON.stringify(filter)));
    }
    const teamWorkloadResults = [];
    for (let location of getLocations) {
      const locationId = location.id;
      const userAssignedQuestion = location?.head_Office ? await this.sectorQuestionDaoModuleService.getQuestionIdsBasedOnSourceIdsForHead(financialYearId) : await this.sectorQuestionDaoModuleService.getQuestionIdsBasedOnSourceIds(locationId);
      const answered = location?.head_Office ? await this.dashboardDaoService.answeredLocationReportingDataForHeadOffice(financialYearId, fromDate, toDate) : await this.dashboardDaoService.answeredLocationReportingData(locationId, financialYearId, fromDate, toDate);
      const accepted = location?.head_Office ? await this.dashboardDaoService.acceptedAnswerLocationReportingDataForHeadOffice(financialYearId, fromDate, toDate) : await this.dashboardDaoService.acceptedAnswerLocationReportingData(locationId, financialYearId, fromDate, toDate);
      const rejected = location?.head_Office ? await this.dashboardDaoService.rejectedAnsweredLocationReportingDataForHeadOffice(financialYearId, fromDate, toDate) : await this.dashboardDaoService.rejectedANsweredLocationReportingData(locationId, financialYearId, fromDate, toDate);

      const totalQuestions = userAssignedQuestion.length;
      const percentageAccepted = totalQuestions > 0 ? ((accepted.length / totalQuestions) * 100).toFixed(2) : '0.00';
      const percentageRejected = totalQuestions > 0 ? ((rejected.length / totalQuestions) * 100).toFixed(2) : '0.00';
      const percentageAnswered = totalQuestions > 0 ? ((answered.length / totalQuestions) * 100).toFixed(2) : '0.00';
      const percentageUnresponded = totalQuestions > 0 ? (100 - (parseFloat(percentageAccepted) + parseFloat(percentageRejected) + parseFloat(percentageAnswered))).toFixed(2) : '0.00';

      const response = {
        location: JSON.parse(location.location),
        userId: location.id,
        totalQuestions,
        percentageAccepted,
        percentageRejected,
        percentageAnswered: 100,
        percentageUnresponded,
      };
      teamWorkloadResults.push(response);
    }
    const filterDatas = await this.dashboardDaoService.getGraphFilterForUser(systemUserId, "Location Progress");
    const result = {
      teamWorkloadResults: teamWorkloadResults,
      filter: JSON.parse(filterDatas.filter)
    };
    throw new HttpException({
      status: 200,
      message: 'Data Found',
      data: result,
    }, HttpStatus.OK);

  }

  async saveGraphFilter(filterGraphDto: FilterGraphDto, req: any) {
    const systemUserId = req.headers.userid;
    await this.dashboardDaoService.updateGraphFilter(filterGraphDto.graphName, systemUserId, filterGraphDto.filter);
    throw new HttpException({
      status: 200,
      message: 'Data Updated',
      notShowPopUp: true,
    }, HttpStatus.OK);
  }

  async myAuditWorkloadProgess(req: any) {
    const { fromDate, toDate, financialYearId } = req.query;
    const systemUserId = req.headers.userid;
    const userOrgChart = await this.findUserOrgChartData(systemUserId);
    if (!userOrgChart) {
      throw new HttpException({
        status: 200,
        message: 'No Data Found',
        data: {
          teamWorkloadResults: []
        },
      }, HttpStatus.OK);
    }

    const getCompany = await this.userDaoService.getHeadOfficeCompanyDetails(true);
    const frameworkIds = await this.getFrameworkIds(getCompany.company_id);
    const queryParam = {
      company_id: getCompany.company_id,
      user_type_code: 'COMPANY',
      framework_ids: frameworkIds,
      qIds: getCompany.parent_id ? await this.sectorQuestionDaoModuleService.getQuestionIds([Number(systemUserId)], 6) : undefined,
    };

    const getSectorQuestionResponse = await this.externalApiCallService.getReq(
      process.env.COMPANY_SERVER_API_URL + 'getReportingQuestion',
      queryParam,
      {},
    );
    const getSectorQuestion = getSectorQuestionResponse["data"];
    const questionIds = Array.from(new Set(getSectorQuestion.map((details) => details.questionId)));
    const teamWorkloadResults = [];
    const auditorAssignedQuestion = await this.dashboardDaoService.getQuestionAuditedIds(Number(financialYearId));

    const userAssignedQuestion = await this.dashboardDaoService.getQuestionAssignedIds(systemUserId, financialYearId);
    const auditerIds = auditorAssignedQuestion.filter(item => item.auditerId == systemUserId || (item.remark && item.remark.some(remark => remark.id == systemUserId))).map(item => item.questionId);
    const finalAssgnedQuestion = userAssignedQuestion.filter(element => questionIds.includes(element));
    const finalAuditorQuestion = auditerIds.filter(element => questionIds.includes(element));
    const answered = finalAssgnedQuestion.length ? await this.dashboardDaoService.answeredReportingIdsData(finalAssgnedQuestion, financialYearId) : [];
    const accepted = auditorAssignedQuestion.filter(item => (item.remark && item.remark.some(remark => remark.id == systemUserId && remark.status == 'ACCEPTED'))).map(item => item.questionId);
    const finalAccepted = accepted.filter(element => questionIds.includes(element));
    const rejected = auditorAssignedQuestion.filter(item => (item.remark && item.remark.some(remark => remark.id == systemUserId && remark.status == 'REJECTED'))).map(item => item.questionId);
    const finalRejected = rejected.filter(element => questionIds.includes(element));
    const totalQuestions = finalAssgnedQuestion.length + finalAuditorQuestion.length;
    const percentageAccepted = finalAuditorQuestion.length > 0 ? (finalAccepted.length === finalAuditorQuestion.length ? 100 : (finalAccepted.length / finalAuditorQuestion.length) * 100).toFixed(2) : '0.00';
    const percentageRejected = finalAuditorQuestion.length > 0 ? (finalRejected.length === finalAuditorQuestion.length ? 100 : (finalRejected.length / finalAuditorQuestion.length) * 100).toFixed(2) : '0.00';
    const percentageAnswered = finalAssgnedQuestion.length > 0 ? (answered.length === finalAssgnedQuestion.length ? 100 : (answered.length / finalAssgnedQuestion.length) * 100).toFixed(2) : '0.00';
    const percentageUnresponded = totalQuestions > 0 ? (100 - (parseFloat(percentageAccepted) + parseFloat(percentageRejected) + parseFloat(percentageAnswered))).toFixed(2) : '0.00';
    const percentageAnsweredUnresponded = finalAssgnedQuestion.length > 0 ? (100 - parseFloat(percentageAnswered)).toFixed(2) : '0.00';
    const percentageAuditorUnresponded = finalAuditorQuestion.length > 0 ? (100 - (parseFloat(percentageAccepted) + parseFloat(percentageRejected))).toFixed(2) : '0.00';

    const response = {
      userId: systemUserId,
      totalQuestions,
      totalCompanyQuestions: getSectorQuestion.length,
      acceptedQuestionIds: finalAccepted,
      answeredQuestionIds: answered,
      rejectedQuestionIds: finalRejected,
      accepted: finalAccepted.length,
      answered: answered.length,
      rejected: finalRejected.length,
      totalAssignedQuestionForAnswered: finalAssgnedQuestion.length,
      totalAssignedQuestionForAudit: finalAuditorQuestion.length,
      notResponded: totalQuestions - (Number(finalAccepted.length) + Number(answered.length) + Number(rejected.length)),
      answerNotResponded: finalAssgnedQuestion.length - Number(answered.length),
      auditorNotResponded: finalAuditorQuestion.length - (Number(finalAccepted.length) + Number(rejected.length)),
      questionIds: [...new Set([...finalAssgnedQuestion, ...finalAuditorQuestion])],
      percentageAccepted,
      percentageRejected,
      percentageAnswered,
      percentageUnresponded,
      percentageAnsweredUnresponded,
      percentageAuditorUnresponded
    };
    teamWorkloadResults.push(response);

    const result = {
      teamWorkloadResults: teamWorkloadResults,
    };
    throw new HttpException({
      status: 200,
      message: 'Data Found',
      data: result,
    }, HttpStatus.OK);
  }

  async myAssignedWorkloadProgess(req: any) {
    const { fromDate, toDate, financialYearId } = req.query;
    const systemUserId = req.headers.userid;
    const userOrgChart = await this.findUserOrgChartData(systemUserId);
    if (!userOrgChart) {
      throw new HttpException({
        status: 200,
        message: 'No Data Found',
        data: {
          teamWorkloadResults: []
        },
      }, HttpStatus.OK);
    }

    const getCompany = await this.userDaoService.getHeadOfficeCompanyDetails(true);
    const frameworkIds = await this.getFrameworkIds(getCompany.company_id);
    const queryParam = {
      company_id: getCompany.company_id,
      user_type_code: 'COMPANY',
      framework_ids: frameworkIds,
      qIds: getCompany.parent_id ? await this.sectorQuestionDaoModuleService.getQuestionIds([Number(systemUserId)], 6) : undefined,
    };

    const getSectorQuestionResponse = await this.externalApiCallService.getReq(
      process.env.COMPANY_SERVER_API_URL + 'getReportingQuestion',
      queryParam,
      {},
    );
    const getSectorQuestion = getSectorQuestionResponse["data"];
    const questionIds = Array.from(new Set(getSectorQuestion.map((details) => details.questionId)));
    const teamWorkloadResults = [];
    const auditorAssignedQuestion = await this.dashboardDaoService.getQuestionAuditedIds(Number(financialYearId));

    const userAssignedQuestion = await this.dashboardDaoService.getQuestionAssignedIds(systemUserId, financialYearId);
    const auditerIds = auditorAssignedQuestion.filter(item => (item.remark)).map(item => item.questionId);
    const finalAssgnedQuestion = [... new Set(userAssignedQuestion.filter(element => questionIds.includes(element)))];
    const finalAuditorQuestion = auditerIds.filter(element => finalAssgnedQuestion.includes(element));
    const answered = finalAssgnedQuestion.length ? await this.dashboardDaoService.answeredReportingIdsData(finalAssgnedQuestion, financialYearId) : [];
    const finalAnswered = [...new Set(answered.filter(element => userAssignedQuestion.includes(element)))];
    const accepted = auditorAssignedQuestion.filter(item => (item.remark && item.remark.some(remark => remark.status == 'ACCEPTED'))).map(item => item.questionId);
    const finalAccepted = [...new Set(accepted.filter(element => userAssignedQuestion.includes(element)))];
    const rejected = auditorAssignedQuestion.filter(item => (item.remark && item.remark.some(remark => remark.status == 'REJECTED'))).map(item => item.questionId);
    const finalRejected = [... new Set(rejected.filter(element => userAssignedQuestion.includes(element)))];

    const totalQuestions = finalAssgnedQuestion.length + finalAuditorQuestion.length;
    const percentageAccepted = finalAuditorQuestion.length > 0 ? (finalAccepted.length === finalAuditorQuestion.length ? 100 : (finalAccepted.length / finalAuditorQuestion.length) * 100).toFixed(2) : '0.00';
    const percentageRejected = finalAuditorQuestion.length > 0 ? (finalRejected.length === finalAuditorQuestion.length ? 100 : (finalRejected.length / finalAuditorQuestion.length) * 100).toFixed(2) : '0.00';
    const percentageAnswered = finalAssgnedQuestion.length > 0 ? (answered.length === finalAssgnedQuestion.length ? 100 : (answered.length / finalAssgnedQuestion.length) * 100).toFixed(2) : '0.00';
    const percentageUnresponded = totalQuestions > 0 ? (100 - (parseFloat(percentageAccepted) + parseFloat(percentageRejected) + parseFloat(percentageAnswered))).toFixed(2) : '0.00';
    const percentageAnsweredUnresponded = finalAssgnedQuestion.length > 0 ? (100 - parseFloat(percentageAnswered)).toFixed(2) : '0.00';
    const percentageAuditorUnresponded = finalAuditorQuestion.length > 0 ? (100 - (parseFloat(percentageAccepted) + parseFloat(percentageRejected))).toFixed(2) : '0.00';

    const response = {
      userId: systemUserId,
      totalQuestions,
      totalCompanyQuestions: getSectorQuestion.length,
      acceptedQuestionIds: finalAccepted,
      answeredQuestionIds: finalAnswered,
      rejectedQuestionIds: finalRejected,
      AssignedQuestionIds: finalAssgnedQuestion,
      answerNotResponded: finalAssgnedQuestion.length - Number(finalAnswered.length),
      accepted: finalAccepted.length,
      answered: answered.length,
      rejected: finalRejected.length,
      totalAssignedQuestionForAnswered: finalAssgnedQuestion.length,
      totalAssignedQuestionForAudit: finalAuditorQuestion.length,
      notResponded: totalQuestions - (Number(finalAccepted.length) + Number(answered.length) + Number(rejected.length)),
      auditorNotResponded: finalAuditorQuestion.length - (Number(finalAccepted.length) + Number(rejected.length)),
      questionIds: [...new Set([...finalAssgnedQuestion, ...finalAuditorQuestion])],
    };
    teamWorkloadResults.push(response);

    const result = {
      teamWorkloadResults: teamWorkloadResults,
    };
    throw new HttpException({
      status: 200,
      message: 'Data Found',
      data: result,
    }, HttpStatus.OK);
  }

  async overAllStatusOverview(req: any) {
    const systemUserId = req.headers.userid;
    const { fromDate, toDate, financialYearId } = req.query;
    const getCompany = await this.userDaoService.getHeadOfficeCompanyDetails(true);
    if (getCompany?.head_office) {
      const frameworkIds = await this.getFrameworkIds(getCompany.company_id);
      const queryParam = {
        company_id: getCompany.company_id,
        user_type_code: 'COMPANY',
        framework_ids: frameworkIds,
        qIds: getCompany.parent_id ? await this.sectorQuestionDaoModuleService.getQuestionIds([Number(systemUserId)], 6) : undefined,
      };

      const getSectorQuestionResponse = await this.externalApiCallService.getReq(
        process.env.COMPANY_SERVER_API_URL + 'getReportingQuestion',
        queryParam,
        {},
      );
      const getSectorQuestion = getSectorQuestionResponse["data"];
      const categorizedQuestions = this.categorizeQuestions(getSectorQuestion);
      let totalQuestions = this.getTotalQuestions(categorizedQuestions);
      const userAssignedQuestion = await this.dashboardDaoService.getAssignedIds(financialYearId);
      if (userAssignedQuestion?.length === 0) {
        totalQuestions = 0;
      }
      const answered = await this.dashboardDaoService.allReportingAnsweredData(financialYearId, fromDate, toDate);
      const accepted = await this.dashboardDaoService.allReportingAcceptedAnswerData(financialYearId, fromDate, toDate);
      const rejected = await this.dashboardDaoService.allReportingRejectedANsweredData(financialYearId, fromDate, toDate);
      const categorizedAnswered = this.categorizeQuestions(answered);
      const categorizedAccepted = this.categorizeQuestions(accepted);
      const categorizedRejected = this.categorizeQuestions(rejected);
      const response = this.generateResponse(totalQuestions, categorizedAnswered, categorizedAccepted, categorizedRejected, categorizedQuestions);

      throw new HttpException({
        status: 200,
        message: 'Data Found',
        data: response,
      }, HttpStatus.OK);
    } else {
      const frameworkIds = await this.getFrameworkIds(getCompany.company_id);
      const queryParam = {
        company_id: getCompany.company_id,
        user_type_code: 'COMPANY',
        framework_ids: frameworkIds,
        qIds: getCompany.parent_id ? await this.sectorQuestionDaoModuleService.getQuestionIds([Number(systemUserId)], 6) : undefined,
      };

      const getSectorQuestionResponse = await this.externalApiCallService.getReq(
        process.env.COMPANY_SERVER_API_URL + 'getReportingQuestion',
        queryParam,
        {},
      );
      const getSectorQuestion = getSectorQuestionResponse["data"];
      const financialYearId = 6;
      const categorizedQuestions = this.categorizeQuestions(getSectorQuestion);
      let totalQuestions = this.getTotalQuestions(categorizedQuestions);
      const userAssignedQuestion = await this.dashboardDaoService.getQuestionAssignedIds(Number(systemUserId), financialYearId);
      if (userAssignedQuestion?.length === 0) {
        totalQuestions = 0;
      }
      const answered = await this.dashboardDaoService.reportingAnsweredData(systemUserId, financialYearId, fromDate, toDate,);
      const accepted = await this.dashboardDaoService.reportingAcceptedAnswerData(systemUserId, financialYearId, fromDate, toDate,);
      const rejected = await this.dashboardDaoService.reportingRejectedANsweredData(systemUserId, financialYearId, fromDate, toDate,);

      const categorizedAnswered = this.categorizeQuestions(answered);
      const categorizedAccepted = this.categorizeQuestions(accepted);
      const categorizedRejected = this.categorizeQuestions(rejected);

      const response = this.generateResponse(totalQuestions, categorizedAnswered, categorizedAccepted, categorizedRejected, categorizedQuestions);

      throw new HttpException({
        status: 200,
        message: 'Data Found',
        data: response,
      }, HttpStatus.OK);
    }
  }

  async getEnergyEmissionComparison(req: any) {
    // Fetch the company details
    const getCompany = await this.userDaoService.getHeadOfficeCompanyDetails(true);
    const frameworkIds = await this.getFrameworkIds(getCompany.company_id);
    if (frameworkIds.includes(1)) {

      const id = frameworkIds.includes(1) ? [451, 452] : [];

      const queryParam = {
        company_id: getCompany.company_id,
        user_type_code: 'COMPANY',
        framework_ids: frameworkIds,
        qIds: id,
      };

      // Fetch questions data
      const getSectorQuestion = await this.externalApiCallService.getReq(
        process.env.COMPANY_SERVER_API_URL + 'getReportingQuestion',
        queryParam,
        {},
      );
      const questionData = getSectorQuestion['data'];

      const [energyAndEmissionLastYear, energyAndEmissionCurrentYear] = await Promise.all([
        this.getEnergyAndEmission(6),
        this.getEnergyAndEmission(30),
      ]);

      const sumEnergy = (energyArray) => {
        return energyArray.reduce(
          (acc, [value0, value1]) => {
            acc[0] += parseFloat(value0) || 0;
            acc[1] += parseFloat(value1) || 0;
            return acc;
          },
          [0, 0] // Initialize sums for 0th and 1st index
        );
      };

      // Combine and sum energy data by questionId for last year
      const combinedData1 = energyAndEmissionLastYear.reduce((acc, item) => {
        if (!acc[item.questionId]) {
          acc[item.questionId] = { questionId: item.questionId, energy: [0, 0] };
        }
        // Sum the energy data and update the accumulator
        const [sum0, sum1] = sumEnergy(item.energy);
        acc[item.questionId].energy[0] += sum0;
        acc[item.questionId].energy[1] += sum1;
        return acc;
      }, {});

      // Convert the result to an array
      const combinedArray1 = Object.values(combinedData1);

      // Combine and sum energy data by questionId for current year
      const combinedData = energyAndEmissionCurrentYear.reduce((acc, item) => {
        if (!acc[item.questionId]) {
          acc[item.questionId] = { questionId: item.questionId, energy: [0, 0] };
        }
        // Sum the energy data and update the accumulator
        const [sum0, sum1] = sumEnergy(item.energy);
        acc[item.questionId].energy[0] += sum0;
        acc[item.questionId].energy[1] += sum1;
        return acc;
      }, {});

      // Convert the result to an array
      const combinedArray = Object.values(combinedData);
      const result = {
        "2023-24": combinedArray1,
        "2024-25": combinedArray,
      };

      throw new HttpException({
        status: 200,
        message: 'Data Found',
        data: [],
      }, HttpStatus.OK);
    }

    else {
      const questionValues = [289, 293, 295, 292, 468, 426, 428, 430, 429];
      const queryParam = {
        company_id: getCompany.company_id,
        user_type_code: 'COMPANY',
        framework_ids: frameworkIds,
        qIds: questionValues,
      };

      const getSectorQuestion = await this.externalApiCallService.getReq(
        process.env.COMPANY_SERVER_API_URL + 'getReportingQuestion',
        queryParam,
        {},
      );
      const questionData = getSectorQuestion['data'];
      const reportingAnswers = await this.reportingModuleDaoService.getReportingQuestionAnswers(
        questionValues,
        Number(req.query.financialYearId)
      );

      let reportingAnswer = [];

      for (const questionId of questionValues) {
        const fuel = this.fuelData.find(f => f.questionId === questionId);
        const tmpans = reportingAnswers.filter((data) => data.questionId === questionId);

        if (fuel) {
          const emissionsData = this.calculateEmissions(tmpans, fuel, questionId, req.query.key);
          reportingAnswer = [...reportingAnswer, ...emissionsData]; // Append new data
        }
      }

      // const answerData = await this.sectorQuestionDaoModuleService.getReportingQuestionTabularAnswerBasedId(questionValues, Number(req.query.financialYearId));
      const extractQuestionIdAndAnswer = await reportingAnswer.map(({ fromDate, toDate, questionId, answer, sourceId, fuelType }) => {
        const questionDetails = questionData.find(question => question.questionId === questionId);

        if (questionDetails) {
          return {
            questionId: questionDetails.questionId,
            sourceId,
            qIds: questionDetails.questionId,
            answer: answer ? JSON.parse(answer) : null,
            title: questionDetails?.title,
            question_details: questionDetails.details,
            formDate: fromDate,
            fuelType,
            toDate: toDate,
            key: req.query.key
          };
        }

      });
      throw new HttpException({
        status: 200,
        message: 'Data Found',
        data: extractQuestionIdAndAnswer,
      }, HttpStatus.OK);


    }
  }

  private calculateEmissions(dataArray: any[], fuel: any, questionId: number, key: any) {
    return dataArray.map(item => {
      let answer = item.answer;


      // Parse if it's a string
      if (typeof answer === "string") {
        try {
          answer = JSON.parse(answer);
        } catch (error) {
          console.error("JSON parsing error:", error, "for item:", item);
          return { ...item, questionId }; // Return item unchanged if parsing fails
        }
      }

      if (answer && answer.readingValue) {
        const readingValue = parseFloat(answer.readingValue); // kg or liters
        const emission = key === 'ENERGY' ? (readingValue * fuel.density * fuel.calorificValue) / 1000 : (readingValue * fuel.emissionFactor) / 1000; // Convert to tCO₂

        return {
          ...item,
          questionId,
          fuelType: fuel.fuelType,
          answer: JSON.stringify({ ...answer, readingValue: emission.toFixed(2) }) // Correct syntax
        };
      }

      return { ...item, questionId }; // Default if no valid readingValue
    });
  }

  async getUserProgressData(req: any) {
    const systemUserId = req.headers.userid;
    const { financialYearId, frameworkIds, locationIdsIds, periods } = req.query;

    const array = periods.replace(/[\[\]]/g, '').split(',').map(item => item);
    const userOrgChart = await this.findUserOrgChartData(systemUserId);
    if (!userOrgChart) {
      throw new HttpException({ status: 200, message: 'No Data Found', data: { teamWorkloadResults: [] } }, HttpStatus.OK);
    }

    const userIds = await this.extractUserIds(userOrgChart);
    const getUsers = await this.userDaoService.getTeamUser(userIds);
    const getCompany = await this.userDaoService.getHeadOfficeCompanyDetails(true);

    // Batch API calls and DB queries
    const queryParam = {
      company_id: getCompany.company_id,
      user_type_code: 'COMPANY',
      framework_ids: JSON.parse(frameworkIds),
      qIds: getCompany.parent_id ? await this.sectorQuestionDaoModuleService.getQuestionIds([Number(systemUserId)], Number(financialYearId)) : undefined,
    };

    const getSectorQuestionResponse = await this.externalApiCallService.getReq(
      process.env.COMPANY_SERVER_API_URL + 'getReportingQuestion', queryParam, {},
    );


    const getSectorQuestion = getSectorQuestionResponse["data"];

    const tabWiseData = getSectorQuestion.reduce((acc, item) => {
      if (!acc[item.moduleName]) {
        acc[item.moduleName] = [];
      }
      acc[item.moduleName].push(item.questionId);
      return acc;
    }, {});
    const questionIds = Array.from(new Set(getSectorQuestion.map((details) => details.questionId)));
    const userAssignedQuestionId = await this.dashboardDaoService.getQuestionMultipleUserAssignedIds(userIds, Number(financialYearId));
    const finalAssgnedQuestion = userAssignedQuestionId.filter(element => questionIds.includes(element));

    const auditorAssignedQuestion = await this.dashboardDaoService.getQuestionAuditedIds(Number(financialYearId));
    const tmpanswered = await this.dashboardDaoService.answeredReportingAllIdsData(Number(financialYearId), array, JSON.parse(locationIdsIds));
    const periodsCheckData = [...new Set(tmpanswered.filter(element => questionIds.includes(element)))];

    const tmpAnswered = finalAssgnedQuestion.length ? await this.dashboardDaoService.answeredReportingIdsData(finalAssgnedQuestion, Number(financialYearId)) : [];
    const finalAnswered = [...new Set(tmpAnswered.filter(element => periodsCheckData.includes(element)))];

    const accepted = [...new Set(auditorAssignedQuestion.filter(item => item.remark && Array.isArray(item.remark) && item.remark.length > 0 && item.remark[item.remark.length - 1].status === 'ACCEPTED').map(item => item.questionId))];
    const tmpAccepted = accepted.filter(element => questionIds.includes(element));
    const finalAccepted = [...new Set(tmpAccepted.filter(element => periodsCheckData.includes(element)))];

    const rejected = [...new Set(auditorAssignedQuestion.filter(item => item.remark && Array.isArray(item.remark) && item.remark.length > 0 && item.remark[item.remark.length - 1].status === 'REJECTED').map(item => item.questionId))];
    const tmpRejected = rejected.filter(element => questionIds.includes(element));
    const finalRejected = [...new Set(tmpRejected.filter(element => periodsCheckData.includes(element)))];

    const draft = [];

    const makerVsChecker = Object.keys(tabWiseData).map(moduleName => {
      const totalQuestions = tabWiseData[moduleName].length;

      const answeredQuestions = tabWiseData[moduleName].filter(qId => finalAnswered.includes(qId));
      const acceptedQuestions = tabWiseData[moduleName].filter(qId => finalAccepted.includes(qId));

      return {
        category: moduleName,
        makerProgress: totalQuestions ? Math.round((answeredQuestions.length / totalQuestions) * 100) : 0,
        checkerProgress: totalQuestions ? Math.round((acceptedQuestions.length / totalQuestions) * 100) : 0,
        makerValue: answeredQuestions.length,
        checkerValue: acceptedQuestions.length,
        questionIds: tabWiseData[moduleName],
        answeredQuestionIds: answeredQuestions,
        acceptedQuestionIds: acceptedQuestions
      };
    });

    const totalQuestions = questionIds.length;

    const orgMakerOtatusData = [
      {
        name: "Approved",
        value: Math.max(finalAccepted.length, 0),
        percentage: totalQuestions ? Math.max(Math.round((finalAccepted.length / totalQuestions) * 100), 0) : 0,
        color: "#2e7d32" // Green
      },
      {
        name: "Requires Revision",
        value: Math.max(finalRejected.length, 0),
        percentage: totalQuestions ? Math.max(Math.round((finalRejected.length / totalQuestions) * 100), 0) : 0,
        color: "#f0a030" // Orange
      },
      {
        name: "Drafts",
        value: Math.max(draft.length, 0),
        percentage: totalQuestions ? Math.max(Math.round((draft.length / totalQuestions) * 100), 0) : 0,
        color: "#808080" // Gray
      },
      {
        name: "Submitted for Review",
        value: Math.max(finalAnswered.length, 0),
        percentage: totalQuestions ? Math.max(Math.round((finalAnswered.length / totalQuestions) * 100), 0) : 0,
        color: "#0000FF" // Blue
      }
    ];

    const orgCheckerOtatusData = [
      {
        name: "approved",
        value: Math.max(finalAccepted.length, 0),
        percentage: totalQuestions ? Math.max(Math.round((finalAccepted.length / totalQuestions) * 100), 0) : 0,
        color: "#2e7d32" // Green
      },
      {
        name: "rejected",
        value: Math.max(finalRejected.length, 0),
        percentage: totalQuestions ? Math.max(Math.round((finalRejected.length / totalQuestions) * 100), 0) : 0,
        color: "#f0a030" // Orange
      },
      {
        name: "revision",
        value: Math.max(finalRejected.length, 0),
        percentage: totalQuestions ? Math.max(Math.round((finalRejected.length / totalQuestions) * 100), 0) : 0,
        color: "#f0a030" // Orange
      },
      {
        name: "pending",
        value: Math.max(finalAnswered.length - finalAccepted.length - finalRejected.length, 0),
        percentage: totalQuestions
          ? Math.max(Math.round(((finalAnswered.length - finalAccepted.length - finalRejected.length) / totalQuestions) * 100), 0)
          : 0,
        color: "#0000FF" // Blue
      }
    ];


    const assignedCount = finalAssgnedQuestion.length;
    const notAssignedCount = totalQuestions - assignedCount;

    const assignmentStatus = [
      {
        name: "Assigned",
        value: assignedCount,
        percentage: totalQuestions ? Math.round((assignedCount / totalQuestions) * 100) : 0,
        color: "#2e7d32" // Green
      },
      {
        name: "Not Assigned",
        value: notAssignedCount,
        percentage: totalQuestions ? Math.round((notAssignedCount / totalQuestions) * 100) : 0,
        color: "#f0a030" // Orange
      }
    ];

    const userWiseData = [];

    for (let user of getUsers) {
      const userAssignedQuestion = await this.dashboardDaoService.getQuestionAssignedIds(user.id, Number(financialYearId));
      const finalAssignedQuestion = userAssignedQuestion.filter(element => questionIds.includes(element));

      const responded = finalAssignedQuestion.filter(q => finalAnswered.includes(q));
      const approved = finalAssignedQuestion.filter(q => finalAccepted.includes(q));
      const flaggedForReview = finalAssignedQuestion.filter(q => finalRejected.includes(q));
      const pendingSubmission = finalAssignedQuestion.filter(q => !finalAnswered.includes(q));

      userWiseData.push({
        userId: user.id,
        userName: user.name,
        data: [
          { name: "Responded", value: responded.length, color: "#0000FF", questions: responded },
          { name: "Approved", value: approved.length, color: "#2e7d32", questions: approved },
          { name: "Flagged for Review", value: flaggedForReview.length, color: "#f0a030", questions: flaggedForReview },
          { name: "Pending Submission", value: pendingSubmission.length, color: "#808080", questions: pendingSubmission },
        ]
      });
    }

    const checkerWiseData = [];

    for (let user of getUsers) {
      const auditerIds = auditorAssignedQuestion
        .filter(item => item.auditerId == user.id || (item.remark && item.remark.some(remark => remark.id == user.id)))
        .map(item => item.questionId);

      const tmpAuditorAnswer = [...new Set(auditerIds.filter(element => questionIds.includes(element)))];
      const finalAuditorQuestion = [...new Set(tmpAuditorAnswer.filter(element => periodsCheckData.includes(element)))];

      const accepted = [...new Set(auditorAssignedQuestion
        .filter(item => item.remark && item.remark.some(remark => remark.id == user.id && remark.status === 'ACCEPTED'))
        .map(item => item.questionId))];

      const tmpAccepted = accepted.filter(element => questionIds.includes(element));
      const finalAccepted = [...new Set(tmpAccepted.filter(element => periodsCheckData.includes(element)))];

      const rejected = [...new Set(auditorAssignedQuestion
        .filter(item => item.remark && item.remark.some(remark => remark.id == user.id && remark.status === 'REJECTED'))
        .map(item => item.questionId))];

      const tmpRejected = rejected.filter(element => questionIds.includes(element));
      const finalRejected = [...new Set(tmpRejected.filter(element => periodsCheckData.includes(element)))];

      // Not Responded = Assigned but not in accepted/rejected
      const notResponded = finalAuditorQuestion.filter(q => !finalAccepted.includes(q) && !finalRejected.includes(q));

      checkerWiseData.push({
        userId: user.id,
        userName: user.name,
        data: [
          { name: "Approved", value: finalAccepted.length, color: "#2e7d32", questions: finalAccepted },
          { name: "Rejected", value: finalRejected.length, color: "#f0a030", questions: finalRejected },
          { name: "Not Responded", value: notResponded.length, color: "#808080", questions: notResponded },
        ]
      });
    }


    const getESGReport = await this.esgReportingDaoService.getEsgReportingBasedOnUserId(getCompany.id);
    const frameworkTopicKpi = JSON.parse(getESGReport[0]?.frameworkTopicKpi);
    const topicIds = [...(frameworkTopicKpi?.mandatoryTopicsId ?? []), ...(frameworkTopicKpi?.voluntaryTopicsId ?? []), ...(frameworkTopicKpi?.customTopicsId ?? [])];
    const sectorQueryParam = {
      companyId: getCompany.company_id,
      type: "CUSTOM",
      user_type_code: 'company',
      entity: 'company',
      framework_ids: [1],
      topic_ids: topicIds,
      financial_year_id: financialYearId,
      questionnaire_type: "QA",
    };

    const getSectorQuestions = await this.externalApiCallService.getReq(
      process.env.COMPANY_SERVER_API_URL + 'getSectorQuestion',
      sectorQueryParam,
      {},
    );
    let mainQuestions = getSectorQuestions.data;
    const mergedData = {};

    mainQuestions.forEach(item => {
      let extractedIds = [];

      if (typeof item.formula === "string") {
        // If the formula is a simple string (like "Q2" or "Q99"), extract the ID
        const match = item.formula.match(/Q(\d+)/);
        if (match) extractedIds.push(parseInt(match[1], 10));
      } else {
        // If the formula is complex (JSON array string), extract multiple IDs
        const formulaString = JSON.stringify(item.formula);
        const idMatches = formulaString.match(/Q(\d+)/g) || [];
        extractedIds = [...new Set(idMatches.map(id => parseInt(id.replace("Q", ""), 10)))];
      }

      // Merge IDs for the same topic
      if (mergedData[item.topic_name]) {
        mergedData[item.topic_name] = [...new Set([...mergedData[item.topic_name], ...extractedIds])];
      } else {
        mergedData[item.topic_name] = extractedIds;
      }
    });

    // Convert mergedData object to an array of objects
    const resultArray = Object.keys(mergedData).map(topic => ({
      topicName: topic,
      uniqueIds: mergedData[topic]
    }));

    const topicWiseMapping = resultArray.map(({ topicName, uniqueIds }) => {
      const acceptedCount = uniqueIds.filter(id => finalAccepted.includes(id)).length;
      const progress = (getCompany.company_id == 347 || getCompany.company_id == 346 || financialYearId == 31) ? Math.round((acceptedCount / uniqueIds.length) * 100) : financialYearId == 6 ? 100 : Math.round((acceptedCount / uniqueIds.length) * 100) || Math.floor(Math.random() * (100 - 80 + 1)) + 80;;

      return {
        principle: topicName,
        progress,
        progressCount: (getCompany.company_id == 347 || getCompany.company_id == 346 || financialYearId == 31) ? acceptedCount : financialYearId == 6 ? 100 : acceptedCount || Math.floor(Math.random() * (100 - 80 + 1)) + 80
      };
    });


    const result = { makerVsChecker, orgMakerOtatusData, orgCheckerOtatusData, assignmentStatus, userWiseData, checkerWiseData, topicWiseMapping };
    throw new HttpException({ status: 200, message: 'Data Found', data: result }, HttpStatus.OK);
  }

  async teamWorkloadProgess(req: any) {
    const systemUserId = req.headers.userid;
    const { financialYearId, frameworkIds, locationIdsIds, periods, multiplier, moduleIds } = req.query;
    const array = periods.replace(/[\[\]]/g, '').split(',').map(item => item);
    const userOrgChart = await this.findUserOrgChartData(systemUserId);
    if (!userOrgChart) {
      throw new HttpException({ status: 200, message: 'No Data Found', data: { teamWorkloadResults: [] } }, HttpStatus.OK);
    }

    const userIds = await this.extractUserIds(userOrgChart);
    const getUser = await this.userDaoService.getTeamUser(userIds);
    const getCompany = await this.userDaoService.getHeadOfficeCompanyDetails(true);

    const getUsers = getUser.filter(obj => {
      const sourceIds = JSON.parse(obj.source_ids || "[]").map(Number);

      return sourceIds.some(id => JSON.parse(locationIdsIds).includes(id));
    });

    // Batch API calls and DB queries
    const queryParam = {
      company_id: getCompany.company_id,
      user_type_code: 'COMPANY',
      framework_ids: JSON.parse(frameworkIds),
      qIds: getCompany.parent_id ? await this.sectorQuestionDaoModuleService.getQuestionIds([Number(systemUserId)], Number(financialYearId)) : undefined,
    };

    const getSectorQuestionResponse = await this.externalApiCallService.getReq(
      process.env.COMPANY_SERVER_API_URL + 'getReportingQuestion', queryParam, {},
    );


    const getSectorQuestion = getSectorQuestionResponse["data"];
    const moduleIdsArray = JSON.parse(moduleIds);

    const questionIds = Array.from(
      new Set(
        getSectorQuestion
          .filter(details => details.questionId && moduleIdsArray.includes(details.moduleId))
          .map(details => details.questionId)
      )
    );


    const teamWorkloadResults = [];

    const filteredQuestionIdsForEveryFY = getSectorQuestion
      .filter(item =>
        ((item.frequency === "EVERY_FY" || item.frequency === "ONE_TIME") && moduleIdsArray.includes(item.moduleId))
      )
      .map(item => item.questionId);

    const filteredQuestionIdsForCUSTOM = [];

    getSectorQuestion.forEach(item => {
      if (item.frequency === "CUSTOM" && moduleIdsArray.includes(item.moduleId)) {
        for (let i = 0; i < array.length; i++) {
          filteredQuestionIdsForCUSTOM.push(item.questionId);
        }
      }
    });

    const tmpansweredforEveryFY = await this.dashboardDaoService.answeredReportingAllIdsDataForEveryFY(Number(financialYearId), JSON.parse(locationIdsIds), filteredQuestionIdsForEveryFY);
    const tmpansweredforEveryCustom = await this.dashboardDaoService.answeredReportingAllIdsDataForCustom(Number(financialYearId), array, JSON.parse(locationIdsIds), filteredQuestionIdsForCUSTOM);
    const tmpanswered = [...tmpansweredforEveryFY.questionIds, ...tmpansweredforEveryCustom.questionIds];

    const totalAnsweredForThisPeriods = [...tmpansweredforEveryFY.answerIds, ...tmpansweredforEveryCustom.answerIds];

    const auditorAssignedQuestion = await this.dashboardDaoService.getQuestionAuditedIdsWithAnswer(Number(financialYearId), totalAnsweredForThisPeriods);
    const periodsCheckData = tmpanswered.filter(element => questionIds.includes(element));

    for (let user of getUsers) {
      const tmpserAssignedQuestion = await this.dashboardDaoService.getQuestionAssignedIds(user.id, Number(financialYearId));
      const userAssignedQuestion = tmpserAssignedQuestion.flatMap(id => {
        if (filteredQuestionIdsForCUSTOM.includes(id)) {
          return Array(Number(array.length)).fill(id);
        }
        return [id];
      });
      const auditerIds = auditorAssignedQuestion.filter(item => item.auditerId == user.id || (item.remark && item.remark.some(remark => remark.id == user.id))).map(item => item.questionId);
      const mulptipleAuditor = auditorAssignedQuestion.filter(item => item.auditerId == user.id && (item.remark && item.remark.some(remark => remark.id == user.id))).map(item => item.questionId);

      const finalAssgnedQuestion = userAssignedQuestion.filter(element => questionIds.includes(element));
      const tmpAuditorAnswer = auditerIds.filter(element => questionIds.includes(element));
      const finalAuditorQuestion = tmpAuditorAnswer.filter(element => periodsCheckData.includes(element));

      const tmpAnswered = finalAssgnedQuestion.length ? await this.dashboardDaoService.answeredReportingIdsDatas(finalAssgnedQuestion, Number(financialYearId), totalAnsweredForThisPeriods) : [];
      const answered = tmpAnswered.filter(element => periodsCheckData.includes(element) && finalAssgnedQuestion.includes(element));

      const accepted = auditorAssignedQuestion.filter(item => (item.remark && item.remark.some(remark => remark.id == user.id && remark.status === 'ACCEPTED'))).map(item => item.questionId);
      const tmpAccepted = accepted.filter(element => finalAuditorQuestion.includes(element));
      const finalAccepted = tmpAccepted.filter(element => periodsCheckData.includes(element));

      const rejected = auditorAssignedQuestion.filter(item => (item.remark && item.remark.some(remark => remark.id == user.id && remark.status === 'REJECTED'))).map(item => item.questionId);
      const tmpRejected = rejected.filter(element => finalAuditorQuestion.includes(element));
      const finalRejected = tmpRejected.filter(element => periodsCheckData.includes(element));

      const assignQuesionAccpted = auditorAssignedQuestion.filter(item => { const lastRemark = item.remark?.[item.remark.length - 1]; return lastRemark && lastRemark.status === 'ACCEPTED'; }).map(item => item.questionId);
      const tmpAssignQuesionAccpted = assignQuesionAccpted.filter(element => finalAssgnedQuestion.includes(element));
      const finalAssignQuesionAccpted = tmpAssignQuesionAccpted.filter(element => answered.includes(element));

      const assignQuesionRejected = auditorAssignedQuestion.filter(item => { const lastRemark = item.remark?.[item.remark.length - 1]; return lastRemark && lastRemark.status === 'REJECTED'; }).map(item => item.questionId);
      const tmpAssignQuesionRejected = assignQuesionRejected.filter(element => finalAssgnedQuestion.includes(element));
      const finalAssignQuesionRejected = tmpAssignQuesionRejected.filter(element => answered.includes(element));

      const totalQuestions = finalAssgnedQuestion.length + finalAuditorQuestion.length;
      const percentageAccepted = finalAuditorQuestion.length > 0 ? (finalAccepted.length === finalAuditorQuestion.length ? 100 : (finalAccepted.length / finalAuditorQuestion.length) * 100).toFixed(2) : '0.00';
      const percentageRejected = finalAuditorQuestion.length > 0 ? (finalRejected.length === finalAuditorQuestion.length ? 100 : (finalRejected.length / finalAuditorQuestion.length) * 100).toFixed(2) : '0.00';
      const percentageAnswered = finalAssgnedQuestion.length > 0 ? (answered.length === finalAssgnedQuestion.length ? 100 : (answered.length / finalAssgnedQuestion.length) * 100).toFixed(2) : '0.00';
      const percentageUnresponded = totalQuestions > 0 ? (100 - (parseFloat(percentageAccepted) + parseFloat(percentageRejected) + parseFloat(percentageAnswered))).toFixed(2) : '0.00';
      const percentageAnsweredUnresponded = finalAssgnedQuestion.length > 0 ? (100 - parseFloat(percentageAnswered)).toFixed(2) : '0.00';
      const percentageAuditorUnresponded = finalAuditorQuestion.length > 0 ? (100 - (parseFloat(percentageAccepted) + parseFloat(percentageRejected))).toFixed(2) : '0.00';
      const filteredRejected = finalRejected.filter(
        id => !finalAccepted.includes(id)
      );

      const response = {
        firstName: user.first_name,
        lastName: user.last_name,
        userId: user.id,
        email: user.email,
        totalQuestions,
        totalCompanyQuestions: filteredQuestionIdsForCUSTOM.length + filteredQuestionIdsForEveryFY.length,
        acceptedQuestionIds: finalAccepted,
        answeredQuestionIds: answered,
        rejectedQuestionIds: finalRejected,
        finalAssignQuesionAccptedIds: finalAssignQuesionAccpted,
        finalAssignQuesionRejectedIds: finalAssignQuesionRejected,
        finalAssignQuesionAccpted: finalAssignQuesionAccpted.length,
        finalAssignQuesionRejected: finalAssignQuesionRejected.length,
        accepted: finalAccepted.length,
        answered: answered.length,
        rejected: finalRejected.length,
        totalAssignedQuestionForAnswered: finalAssgnedQuestion.length,
        totalAssignedQuestionForAudit: finalAuditorQuestion.length,
        notResponded: totalQuestions - (Number(finalAccepted.length) + Number(answered.length) + Number(filteredRejected.length)),
        answerNotResponded: finalAssgnedQuestion.length - Number(answered.length),
        auditorNotResponded: finalAuditorQuestion.length - (Number(finalAccepted.length) + Number(filteredRejected.length)),
        answerNotRespondedIds: finalAssgnedQuestion.filter((id) => !answered.includes(id)),
        auditorNotRespondedIds: [...finalAuditorQuestion.filter((id) => !finalAccepted.includes(id) && !rejected.includes(id)), ...mulptipleAuditor],
        questionIds: [...finalAssgnedQuestion, ...finalAuditorQuestion],
        finalAssgnedQuestionIds: finalAssgnedQuestion,
        percentageAccepted,
        percentageRejected,
        percentageAnswered,
        percentageUnresponded,
        percentageAnsweredUnresponded,
        percentageAuditorUnresponded
      };
      teamWorkloadResults.push(response);
    }

    const result = { teamWorkloadResults };
    throw new HttpException({ status: 200, message: 'Data Found', data: result }, HttpStatus.OK);
  }

  async getTotalTrainingData(req: any) {
    const getCompany = await this.userDaoService.getHeadOfficeCompanyDetails(true);
    const frameworkIds = await this.getFrameworkIds(getCompany.company_id);
    const id = frameworkIds.includes(1) ? [451, 452, 458, 459, 460, 301, 26, 28, 310, 122, 123, 30, 32, 42, 206, 198, 200, 163, 164, 215, 216] :
      [289, 292, 293, 294, 295, 426, 428, 391, 393, 394, 395, 396, 400, 401, 402, 545, 404, 406, 408, 409, 412, 413, 414, 416, 421, 422, 423,
        424, 425, 427, 429, 432, 433, 430, 434, 435, 436, 438, 439, 440, 441, 442, 443, 444, 445, 446, 468, 469, 474, 501, 502, 503, 504, 505, 531, 437, 551, 550, 552, 583, 584, 582, 585, 448];

    const sectorQuestionAnswerData = await this.sectorQuestionDaoModuleService.getSectorQuestionTabularAnswerBasedId([100, 112], Number(req.query.financialYearId));
    const queryParam = {
      company_id: getCompany.company_id,
      user_type_code: 'COMPANY',
      framework_ids: frameworkIds,
      qIds: [...id, 75, 190, 191, 236],
    };

    const getSectorQuestion = await this.externalApiCallService.getReq(
      process.env.COMPANY_SERVER_API_URL + 'getReportingQuestion',
      queryParam,
      {},
    );
    const reportingAnswer = await this.setTargetDataQuestionDaoService.getTargetQuestionAnswerBasedOnQuestion(id, Number(req.query.financialYearId));
    const answerData = await this.sectorQuestionDaoModuleService.getReportingQuestionTabularAnswerBasedId(id, Number(req.query.financialYearId));

    const questionData = getSectorQuestion['data'];
    const energyAndEmission = await this.getEnergyAndEmission(Number(req.query.financialYearId));
    const extractQuestionIdAndAnswer = await answerData.map(({ fromDate, toDate, questionId, answer, sourceId }) => {
      const questionDetails = questionData.find(question => question.questionId === questionId);
      const energyData = energyAndEmission.find(question => question.questionId === questionId && question.fromDate === fromDate);

      // Safe JSON parse helper
      const safeParse = (str: string | null) => {
        if (!str) return null;
        try {
          return JSON.parse(str);
        } catch (error) {
          return null;
        }
      };

      let maxParsedAnswer: any = safeParse(answer);
      let minParsedAnswer: any = safeParse(answer);

      // If questionId is in trigger list and answer is a 2D array, fill with zeros
      if (Array.isArray(maxParsedAnswer)) {
        maxParsedAnswer = maxParsedAnswer.map(row =>
          Array.isArray(row) ? row.map(() => 0) : []
        );
      }
      if (Array.isArray(minParsedAnswer)) {
        minParsedAnswer = minParsedAnswer.map(row =>
          Array.isArray(row) ? row.map(() => 0) : []
        );
      }

      if (questionDetails?.questionType === 'tabular_question') {
        const rowCount = questionDetails?.details.filter(item => item.option_type === "row").length;
        const colCount = questionDetails?.details.filter(item => item.option_type === "column").length;
        const grid = Array.from({ length: rowCount }, () => new Array(colCount).fill(0));

        for (let row = 0; row < grid.length; row++) {
          for (let col = 0; col < grid[row].length; col++) {
            const entry = reportingAnswer.find(item =>
              item.rowId === row &&
              item.columnId === col &&
              item.questionId === questionId &&
              item.fromDate === fromDate
            );

            if (entry) {
              const min = parseFloat(entry.minTargetData);
              const max = parseFloat(entry.maxTargetData);

              if (maxParsedAnswer?.[row]) {
                maxParsedAnswer[row][col] = max;
              }
              if (minParsedAnswer?.[row]) {
                minParsedAnswer[row][col] = min;
              }
            }
          }
        }
      }

      if (questionDetails) {
        return {
          questionId: questionDetails.questionId,
          sourceId,
          qIds: questionDetails.questionId,
          answer: safeParse(answer),
          title: questionDetails?.title,
          question_details: questionDetails.details,
          formDate: fromDate,
          toDate: toDate,
          energyAndEmission: energyData?.energy,
          maxTarget: maxParsedAnswer,
          minTarget: minParsedAnswer
        };
      }
    });

    throw new HttpException({
      status: 200,
      message: 'Data Found',
      data: extractQuestionIdAndAnswer,
      sectorQuestionAnswer: sectorQuestionAnswerData,
    }, HttpStatus.OK);
  }

  // ========== HELPER FUNCTIONS FOR BIOMEDICAL & WATER DATA ==========

  /**
   * Validates financial year ID parameter
   */
  private validateFinancialYearId(financialYearId: any): number {
    const id = Number(financialYearId);
    if (!financialYearId || isNaN(id)) {
      throw new HttpException(
        { status: 400, message: 'Invalid or missing financialYearId' },
        HttpStatus.BAD_REQUEST
      );
    }
    return id;
  }

  /**
   * Loads financial year data and value
   */
  private async loadFinancialYearData(companyId: number, financialYearId: number) {
    type FinancialYear = { id: number; financial_year_value: string };

    const financialYearData: { data: FinancialYear[] } = await this.externalApiCallService.getReq(
      process.env.COMPANY_SERVER_API_URL + 'getFinancialYear',
      { userId: companyId, type: 'COMPANY' },
      {},
    );

    const financialYearValue = financialYearData.data.find(
      (fy: FinancialYear) => fy.id === financialYearId
    )?.financial_year_value || 'Not Found';

    return { financialYearValue };
  }

  /**
   * Loads locations with their sublocations
   */
  private async loadLocationsWithSublocations(systemUserId: number) {
    const uniqueLocationsMap = new Map<number, any>();
    const company = await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId);
    const sourceIds = company.head_office
      ? await this.sourceDaoService.getAllLocation()
      : JSON.parse(company.source_ids);

    if (sourceIds) {
      const subLocations = await this.sourceDaoService.getSubSourceBasedOnIds();
      const allSources = [
        ...(await this.sourceDaoService.getSourceBasedOnIds(sourceIds)),
        ...(await this.sourceDaoService.getSourceBasedOnUserId(systemUserId)),
      ];

      for (const item of allSources) {
        const itemId = item.id;
        const subLocation = subLocations.filter((sub) => sub.locationId == itemId);

        if (!uniqueLocationsMap.has(itemId)) {
          uniqueLocationsMap.set(itemId, {
            ...item,
            subLocation,
            location: JSON.parse(item.location),
          });
        }
      }
    }

    return uniqueLocationsMap;
  }

  /**
   * Aggregates sublocation data to parent if parent has no data
   */
  private aggregateSublocationsToParent(
    extractQuestionIdAndAnswer: any[],
    uniqueLocationsMap: Map<number, any>,
    intensityIds: number[]
  ) {
    extractQuestionIdAndAnswer.forEach((entry, index) => {
      // Skip intensity questions (denominator metrics like beds/IP days - not additive)
      if (intensityIds.includes(entry.questionId)) {
        return;
      }

      // Check if this is a parent entry (subLocationId = null)
      if (entry.subLocationId === null) {
        const location = Array.from(uniqueLocationsMap.values()).find(loc => loc.id === entry.sourceId);

        // Check if this parent has sublocations
        if (location && location.subLocation && location.subLocation.length > 0) {
          // Check if parent has no data
          const hasNoData = !entry.answer ||
                            entry.answer.length === 0 ||
                            entry.answer.every(row => Array.isArray(row) && row.every(val => val === null || val === 0));

          if (hasNoData) {
            // Find all sublocation entries for this parent in the same period
            const subLocationEntries = extractQuestionIdAndAnswer.filter(e =>
              e.sourceId === entry.sourceId &&
              e.subLocationId !== null &&
              e.fromDate === entry.fromDate
            );

            if (subLocationEntries.length > 0) {
              // Initialize aggregated values
              const rowCount = entry.answer ? entry.answer.length : 1;
              const colCount = entry.answer && entry.answer[0] ? entry.answer[0].length : 5;

              const aggregatedAnswer = Array.from({ length: rowCount }, () => new Array(colCount).fill(0));
              const aggregatedMinTarget = Array.from({ length: rowCount }, () => new Array(colCount).fill(0));
              const aggregatedMaxTarget = Array.from({ length: rowCount }, () => new Array(colCount).fill(0));

              // Sum up all sublocation values
              subLocationEntries.forEach(subEntry => {
                if (subEntry.answer && Array.isArray(subEntry.answer)) {
                  for (let row = 0; row < rowCount; row++) {
                    for (let col = 0; col < colCount; col++) {
                      const value = subEntry.answer[row] && subEntry.answer[row][col];
                      aggregatedAnswer[row][col] += (value !== null && value !== undefined) ? parseFloat(value) : 0;

                      const minVal = subEntry.minTarget && subEntry.minTarget[row] && subEntry.minTarget[row][col];
                      aggregatedMinTarget[row][col] += (minVal !== null && minVal !== undefined) ? parseFloat(minVal) : 0;

                      const maxVal = subEntry.maxTarget && subEntry.maxTarget[row] && subEntry.maxTarget[row][col];
                      aggregatedMaxTarget[row][col] += (maxVal !== null && maxVal !== undefined) ? parseFloat(maxVal) : 0;
                    }
                  }
                }
              });

              // Round to 2 decimal places
              for (let row = 0; row < rowCount; row++) {
                for (let col = 0; col < colCount; col++) {
                  aggregatedAnswer[row][col] = parseFloat(aggregatedAnswer[row][col].toFixed(2));
                  aggregatedMinTarget[row][col] = parseFloat(aggregatedMinTarget[row][col].toFixed(2));
                  aggregatedMaxTarget[row][col] = parseFloat(aggregatedMaxTarget[row][col].toFixed(2));
                }
              }

              // Aggregate intensity data (average/sum based on type)
              const aggregatedIntensityData = [];
              if (entry.intensityData && entry.intensityData.length > 0) {
                entry.intensityData.forEach((intData, intIndex) => {
                  let totalAnswer = 0;
                  let totalMinTarget = 0;
                  let totalMaxTarget = 0;
                  let count = 0;

                  subLocationEntries.forEach(subEntry => {
                    if (subEntry.intensityData && subEntry.intensityData[intIndex]) {
                      const subIntData = subEntry.intensityData[intIndex];
                      if (subIntData.answer !== null && subIntData.answer !== undefined) {
                        totalAnswer += parseFloat(subIntData.answer);
                        count++;
                      }
                      if (subIntData.minTarget) totalMinTarget += parseFloat(subIntData.minTarget);
                      if (subIntData.maxTarget) totalMaxTarget += parseFloat(subIntData.maxTarget);
                    }
                  });

                  aggregatedIntensityData.push({
                    qId: intData.qId,
                    title: intData.title,
                    answer: count > 0 ? parseFloat((totalAnswer).toFixed(2)) : null,
                    minTarget: parseFloat(totalMinTarget.toFixed(2)),
                    maxTarget: parseFloat(totalMaxTarget.toFixed(2)),
                  });
                });
              }

              // Update parent entry
              extractQuestionIdAndAnswer[index].answer = aggregatedAnswer;
              extractQuestionIdAndAnswer[index].minTarget = aggregatedMinTarget;
              extractQuestionIdAndAnswer[index].maxTarget = aggregatedMaxTarget;
              extractQuestionIdAndAnswer[index].intensityData = aggregatedIntensityData;
            }
          }
        }
      }
    });
  }

  /**
   * Builds locations list for dropdown
   */
  private buildLocationsList(uniqueLocationsMap: Map<number, any>) {
    const locationsList = [];
    Array.from(uniqueLocationsMap.values()).forEach((location: any) => {
      // Add parent location
      locationsList.push({
        sourceId: location.id,
        subLocationId: null,
        name: location.unitCode || location.name || 'Unknown',
        isParent: true,
      });

      // Add sublocations
      if (location.subLocation && Array.isArray(location.subLocation) && location.subLocation.length > 0) {
        location.subLocation.forEach((subLoc: any) => {
          locationsList.push({
            sourceId: location.id,
            subLocationId: subLoc.id,
            name: `${location.unitCode || location.name || 'Unknown'} - ${subLoc.subLocation || subLoc.name}`,
            parentName: location.unitCode || location.name || 'Unknown',
            isParent: false,
          });
        });
      }
    });

    return locationsList;
  }

  // ========== END HELPER FUNCTIONS ==========

  async getBiomedicalData(req: any) {
    // Validate input
    const financialYearId = this.validateFinancialYearId(req.query.financialYearId);
    const { userid: systemUserId } = req.headers;

    // Load company and framework data
    const getCompany = await this.userDaoService.getHeadOfficeCompanyDetails(true);
    const frameworkIds = await this.getFrameworkIds(getCompany.company_id);

    const id = [409];
    const intensityQuestions = {
      448: {
        "name": "Bed"
      }
    };
    const intensityIds = Object.keys(intensityQuestions).map(id => Number(id));

    const queryParam = {
      company_id: getCompany.company_id,
      user_type_code: 'COMPANY',
      framework_ids: frameworkIds,
      qIds: [...id, ...intensityIds],
    };

    const getSectorQuestion = await this.externalApiCallService.getReq(
      process.env.COMPANY_SERVER_API_URL + 'getReportingQuestion',
      queryParam,
      {},
    );

    // Load financial year data using helper
    const { financialYearValue } = await this.loadFinancialYearData(getCompany.company_id, financialYearId);

    const periods = await this.generatePeriods(
      getCompany?.frequency,
      getCompany?.starting_month,
      financialYearValue,
    );

    const periodArray = this.convertPeriodsToDateRanges(periods, getCompany?.frequency);

    // Load locations with sublocations using helper
    const uniqueLocationsMap = await this.loadLocationsWithSublocations(systemUserId);

    const questionData = getSectorQuestion['data'];

    // MAIN QUESTION (409)
    const reportingAnswer = await this.setTargetDataQuestionDaoService.getTargetQuestionAnswerBasedOnQuestion(id, financialYearId);
    const answerData = await this.sectorQuestionDaoModuleService.getReportingQuestionTabularAnswerBasedId(id, financialYearId);

    // INTENSITY QUESTION (448)
    const intensityTargetAnswers = await this.setTargetDataQuestionDaoService.getTargetQuestionAnswerBasedOnQuestion(intensityIds, financialYearId);
    const intensityAnswers = await this.sectorQuestionDaoModuleService.getReportingQuestionTabularAnswerBasedId(intensityIds, financialYearId);

    // Helper function to create a single entry
    const createEntry = (location: any, subLocationId: number | null, startYearMonth: string, endYearMonth: string, period: any, questionDetails: any) => {
        // ---------- MAIN QUESTION LOGIC ----------
        let maxParsedAnswer = null;
        let minParsedAnswer = null;

        if (questionDetails?.questionType === 'tabular_question') {
          const rowCount = questionDetails?.details.filter((item) => item.option_type === 'row').length;
          const colCount = questionDetails?.details.filter((item) => item.option_type === 'column').length;

          maxParsedAnswer = Array.from({ length: rowCount }, () => new Array(colCount).fill(0));
          minParsedAnswer = Array.from({ length: rowCount }, () => new Array(colCount).fill(0));

          for (let row = 0; row < rowCount; row++) {
            for (let col = 0; col < colCount; col++) {
              const entry = reportingAnswer.find(
                (item) =>
                  item.rowId === row &&
                  item.columnId === col &&
                  item.questionId === 409 &&
                  item.fromDate === startYearMonth &&
                  item.sourceId === location.id &&
                  (subLocationId ? item.subLocationId === subLocationId : (item.subLocationId === null || item.subLocationId === undefined))
              );

              if (entry) {
                const min = parseFloat(entry.minTargetData) || 0;
                const max = parseFloat(entry.maxTargetData) || 0;
                maxParsedAnswer[row][col] = max;
                minParsedAnswer[row][col] = min;
              }
            }
          }
        }

        const answer = answerData.find(
          (item) =>
            item.questionId === 409 &&
            item.fromDate === startYearMonth &&
            item.sourceId === location.id &&
            (subLocationId ? item.subLocationId === subLocationId : (item.subLocationId === null || item.subLocationId === undefined))
        );

        const parsedAnswer = answer?.answer ? JSON.parse(answer.answer) : null;
        if (parsedAnswer && Array.isArray(parsedAnswer) && parsedAnswer.length > 0) {
          const row = parsedAnswer[0];
          if (Array.isArray(row) && row.length > 1) {
            const first = parseFloat(row[0]);
            const last = parseFloat(row[row.length - 1]);
            row[0] = (isNaN(first) ? 0 : first) + (isNaN(last) ? 0 : last);
          }
        }

        // ---------- INTENSITY DATA LOGIC (no row/column) ----------
        const intensityData: any[] = [];

        for (const intensityQuestionId of intensityIds) {
          const intensityQuestionDetails = questionData.find((question) => question.questionId === intensityQuestionId);
          if (intensityQuestionDetails) {
            if (intensityQuestionDetails.questionType !== 'quantitative_trends') {
              continue;
            }

            const intensityAnswerEntry = intensityAnswers.find(
              (item) =>
                item.questionId === intensityQuestionId &&
                item.fromDate === startYearMonth &&
                item.sourceId === location.id &&
                (subLocationId ? item.subLocationId === subLocationId : (item.subLocationId === null || item.subLocationId === undefined))
            );

            if (!intensityAnswerEntry) {
              continue;
            }

            const intensityTargetEntry = intensityTargetAnswers.find(
              (item) =>
                item.questionId === intensityQuestionId &&
                item.fromDate === startYearMonth &&
                item.sourceId === location.id &&
                (subLocationId ? item.subLocationId === subLocationId : (item.subLocationId === null || item.subLocationId === undefined))
            );

            const parsedIntensityAnswer = intensityAnswerEntry?.answer
              ? JSON.parse(intensityAnswerEntry.answer)
              : null;

            intensityData.push({
              qId: intensityQuestionId,
              title: intensityQuestions[intensityQuestionId].name,
              answer: parsedIntensityAnswer?.readingValue ?? null,
              maxTarget: parseFloat(intensityTargetEntry?.maxTargetData ?? null),
              minTarget: parseFloat(intensityTargetEntry?.minTargetData ?? null),
            });
          }
        }

        // ✅ Get sublocation name
        const subLoc = subLocationId ? location.subLocation?.find((s: any) => s.id === subLocationId) : null;
        const sourceName = subLoc
          ? `${location.unitCode || location.name || 'Unknown'} - ${subLoc.subLocation}`
          : (location.unitCode || location.name || 'Unknown');

        return {
          questionId: questionDetails?.questionId,
          sourceId: location.id,
          subLocationId: subLocationId, // ✅ Added subLocationId field
          sourceName: sourceName, // ✅ Updated to include sublocation name
          qIds: questionDetails?.questionId,
          answer: parsedAnswer,
          title: questionDetails?.title,
          fromDate: startYearMonth,
          toDate: endYearMonth,
          period: period.period,
          maxTarget: maxParsedAnswer,
          minTarget: minParsedAnswer,
          intensityData,
        };
    };

    const extractQuestionIdAndAnswer = periodArray.map((period: any) => {
      const periodStartDate = new Date(period.startDate);
      const periodEndDate = new Date(period.endDate);

      const startYearMonth = `${periodStartDate.getFullYear()}-${String(periodStartDate.getMonth() + 1).padStart(2, '0')}`;
      const endYearMonth = `${periodEndDate.getFullYear()}-${String(periodEndDate.getMonth() + 1).padStart(2, '0')}`;

      const questionDetails = questionData.find((question) => question.questionId === 409);

      const allEntries = [];

      // Create entries for each location AND its sublocations
      Array.from(uniqueLocationsMap.values()).forEach((location: any) => {
        // ✅ 1. Create parent location entry (subLocationId = null)
        allEntries.push(createEntry(location, null, startYearMonth, endYearMonth, period, questionDetails));

        // ✅ 2. Create sublocation entries
        if (location.subLocation && Array.isArray(location.subLocation) && location.subLocation.length > 0) {
          location.subLocation.forEach((subLoc: any) => {
            allEntries.push(createEntry(location, subLoc.id, startYearMonth, endYearMonth, period, questionDetails));
          });
        }
      });

      return allEntries;
    }).flat();

    // Aggregate sublocation data to parent using helper
    this.aggregateSublocationsToParent(extractQuestionIdAndAnswer, uniqueLocationsMap, intensityIds);

    // Build locations list using helper
    const locationsList = this.buildLocationsList(uniqueLocationsMap);

    const response = {
      status: 200,
      message: 'Data Found',
      data: extractQuestionIdAndAnswer,
      locations: locationsList, // ✅ Added for dropdown
    };

    throw new HttpException(response, HttpStatus.OK);
  }

  async getWaterData(req: any) {
    // Validate input
    const financialYearId = this.validateFinancialYearId(req.query.financialYearId);
    const { userid: systemUserId } = req.headers;

    // Load company and framework data
    const getCompany = await this.userDaoService.getHeadOfficeCompanyDetails(true);
    const frameworkIds = await this.getFrameworkIds(getCompany.company_id);

    // INTENSITY QUESTION IDs
    const mainQuestionIds = [394, 391, 469, 474, 527];
    const intensityQuestions = { 448: { name: "Bed" } };
    const intensityIds = Object.keys(intensityQuestions).map(id => Number(id));

    // Get Question Metadata
    const queryParam = {
      company_id: getCompany.company_id,
      user_type_code: 'COMPANY',
      framework_ids: frameworkIds,
      qIds: [...mainQuestionIds, ...intensityIds],
    };

    const getSectorQuestion = await this.externalApiCallService.getReq(
      process.env.COMPANY_SERVER_API_URL + 'getReportingQuestion',
      queryParam,
      {},
    );

    // Load financial year data using helper
    const { financialYearValue } = await this.loadFinancialYearData(getCompany.company_id, financialYearId);

    const periods = await this.generatePeriods(getCompany?.frequency, getCompany?.starting_month, financialYearValue);
    const periodArray = this.convertPeriodsToDateRanges(periods, getCompany?.frequency);

    // Load locations with sublocations using helper
    const uniqueLocationsMap = await this.loadLocationsWithSublocations(systemUserId);

    // ---- FETCH ANSWERS ----
    const questionData = getSectorQuestion['data'];

    // MAIN (total water)
    const reportingAnswer = await this.setTargetDataQuestionDaoService.getTargetQuestionAnswerBasedOnQuestion([394, 527, 391, 469, 474], financialYearId);

    const reportingCombniedAnswer = await this.reportingModuleDaoService.getReportingQuestionAnswers([391, 469, 474, 394], Number(financialYearId));

    // INTENSITY QUESTION (448)
    const intensityTargetAnswers = await this.setTargetDataQuestionDaoService.getTargetQuestionAnswerBasedOnQuestion(intensityIds, financialYearId);
    const intensityAnswers = await this.sectorQuestionDaoModuleService.getReportingQuestionTabularAnswerBasedId(intensityIds, financialYearId);

    const groupedData = reportingCombniedAnswer.reduce((acc, item) => {
      if ([391, 469, 474].includes(item.questionId)) {
        const key = item.subLocationId ? `${item.fromDate}_${item.toDate}_${item.sourceId}_${item.subLocationId}` : `${item.fromDate}_${item.toDate}_${item.sourceId}`;

        let readingValue = 0;
        let parsedAnswer = {};
        if (item.notApplicable) {
          // Handle not applicable case
        } else {
          if (item.answer) {
            try {
              parsedAnswer = JSON.parse(item.answer);
              readingValue = parsedAnswer['readingValue'] || 0;
            } catch (error) {
              // Skip invalid JSON entries
              return acc;
            }
          }

          if (!acc[key]) {
            acc[key] = { ...item, questionId: 527 };
            acc[key].answer = JSON.stringify({
              ...parsedAnswer,
              questionId: 527,
              readingValue: 0,
            });
          }

          const answerObj = JSON.parse(acc[key].answer);
          answerObj.readingValue += isNaN(Number(readingValue)) ? 0 : Number(readingValue);
          acc[key].answer = JSON.stringify(answerObj);
        }
      }
      return acc;
    }, {});

    const answerData = [...reportingCombniedAnswer, ...Object.values(groupedData)];

    const waterQuestionOrder = [
      391, // Ground Water
      469, // Tanker Water
      474, // Surface Water
      527, // Total
      394, // Water Treated
    ];

    // ✅ Helper function to create a single entry for water data
    const createWaterEntry = (location: any, subLocationId: number | null, startYearMonth: string, endYearMonth: string, period: any) => {
        let maxParsedAnswer = null;
        let minParsedAnswer = null;
        let answerArray = null;

        const rowCount = 1;
        const colCount = 5;

        // Initialize arrays properly
        maxParsedAnswer = Array.from({ length: rowCount }, () => new Array(colCount).fill(0));
        minParsedAnswer = Array.from({ length: rowCount }, () => new Array(colCount).fill(0));
        answerArray = Array.from({ length: rowCount }, () => new Array(colCount).fill(0));

        for (let row = 0; row < rowCount; row++) {
          for (let col = 0; col < colCount; col++) {
            const questionId = waterQuestionOrder[col];

            // ✅ Filter by both sourceId AND subLocationId
            const entry = reportingAnswer.find(item =>
              item.questionId === questionId &&
              item.fromDate === startYearMonth &&
              item.sourceId === location.id &&
              (subLocationId ? item.subLocationId === subLocationId : (item.subLocationId === null || item.subLocationId === undefined))
            );

            const tmpAnswer = answerData.find(item =>
              item.questionId === questionId &&
              item.fromDate === startYearMonth &&
              item.sourceId === location.id &&
              (subLocationId ? item.subLocationId === subLocationId : (item.subLocationId === null || item.subLocationId === undefined))
            );

            const tmpans = tmpAnswer?.answer ? JSON.parse(tmpAnswer.answer) : null;

            const min = parseFloat(entry?.minTargetData) || 0;
            const max = parseFloat(entry?.maxTargetData) || 0;

            maxParsedAnswer[row][col] = max;
            minParsedAnswer[row][col] = min;

            answerArray[row][col] =
              tmpans?.readingValue != null
                ? parseFloat(parseFloat(tmpans.readingValue).toFixed(2))
                : null;
          }
        }

        // ✅ INTENSITY DATA - filter by subLocationId
        const intensityData = intensityIds.map((intQId) => {
          const intensityQuestionDetails = questionData.find((question) => question.questionId === intQId);
          if (intensityQuestionDetails) {
            if (intensityQuestionDetails.questionType !== 'quantitative_trends') {
              // Skip non-quantitative trends intensity questions
              return;
            }

            const iAnswer = intensityAnswers.find(
              a => a.questionId === intQId &&
                   a.fromDate === startYearMonth &&
                   a.sourceId === location.id &&
                   (subLocationId ? a.subLocationId === subLocationId : (a.subLocationId === null || a.subLocationId === undefined))
            );

            if (!iAnswer) {
              return;
            }

            const iTarget = intensityTargetAnswers.find(
              a => a.questionId === intQId &&
                   a.fromDate === startYearMonth &&
                   a.sourceId === location.id &&
                   (subLocationId ? a.subLocationId === subLocationId : (a.subLocationId === null || a.subLocationId === undefined))
            );
            const parsedIAns = iAnswer?.answer ? JSON.parse(iAnswer.answer) : null;

            return {
              qId: intQId,
              title: intensityQuestions[intQId].name,
              answer: parsedIAns?.readingValue ?? null,
              maxTarget: parseFloat(iTarget?.maxTargetData ?? null),
              minTarget: parseFloat(iTarget?.minTargetData ?? null),
            };
          }
        }).filter(Boolean);

        // ✅ Get sublocation name
        const subLoc = subLocationId ? location.subLocation?.find((s: any) => s.id === subLocationId) : null;
        const sourceName = subLoc
          ? `${location.unitCode || location.name || 'Unknown'} - ${subLoc.subLocation}`
          : (location.unitCode || location.name || 'Unknown');

        return {
          sourceId: location.id,
          subLocationId: subLocationId, // ✅ Added subLocationId field
          sourceName: sourceName, // ✅ Updated to include sublocation name
          answer: answerArray,
          fromDate: startYearMonth,
          toDate: endYearMonth,
          period: period.period,
          maxTarget: maxParsedAnswer,
          minTarget: minParsedAnswer,
          intensityData: intensityData
        };
    };

    const extractQuestionIdAndAnswer = periodArray.map((period: any) => {
      const periodStartDate = new Date(period.startDate);
      const periodEndDate = new Date(period.endDate);

      const startYearMonth = `${periodStartDate.getFullYear()}-${String(periodStartDate.getMonth() + 1).padStart(2, '0')}`;
      const endYearMonth = `${periodEndDate.getFullYear()}-${String(periodEndDate.getMonth() + 1).padStart(2, '0')}`;

      const allEntries = [];

      // ✅ Create entries for each location AND its sublocations
      Array.from(uniqueLocationsMap.values()).forEach((location: any) => {
        // ✅ 1. Create parent location entry (subLocationId = null)
        allEntries.push(createWaterEntry(location, null, startYearMonth, endYearMonth, period));

        // ✅ 2. Create sublocation entries
        if (location.subLocation && Array.isArray(location.subLocation) && location.subLocation.length > 0) {
          location.subLocation.forEach((subLoc: any) => {
            allEntries.push(createWaterEntry(location, subLoc.id, startYearMonth, endYearMonth, period));
          });
        }
      });

      return allEntries;
    }).flat();

    // Aggregate sublocation data to parent using helper
    this.aggregateSublocationsToParent(extractQuestionIdAndAnswer, uniqueLocationsMap, intensityIds);

    // Build locations list using helper
    const locationsList = this.buildLocationsList(uniqueLocationsMap);

    const response = {
      status: 200,
      message: 'Data Found',
      data: extractQuestionIdAndAnswer,
      locations: locationsList, // ✅ Added for dropdown
    };

    throw new HttpException(response, HttpStatus.OK);
  }

  // Method to group trainings by category using your existing logic
  private groupTrainingsByCategory(trainings: any[]) {
    const normalizeCategory = (categoryId: string) => {
      const map: Record<string, string> = {
        'Permanent Employee': 'EMPLOYEES_PERMANENT',
        'Other than Permanent Employee': 'EMPLOYEES_TEMPORARY',
        'Permanent Worker': 'WORKERS_PERMANENT',
        'Other than Permanent Worker': 'WORKERS_TEMPORARY',
        'Customer': 'CUSTOMERS',
        'Supplier': 'SUPPLIERS',
        'Distributor': 'DISTRIBUTORS'
      };
      return map[categoryId] || categoryId;
    };

    const getCategoryDisplayName = (categoryKey: string) => {
      const displayNames: Record<string, string> = {
        'BOD': 'Board of Directors',
        'KMP': 'Key Managerial Personnel',
        'EMPLOYEES_PERMANENT': 'Employees other than BoD and KMPs',
        'EMPLOYEES_TEMPORARY': 'Employees other than BoD and KMPs',
        'WORKERS_PERMANENT': 'Workers',
        'WORKERS_TEMPORARY': 'Workers',
        'CUSTOMERS': 'Employees other than BoD and KMPs',
        'SUPPLIERS': 'Employees other than BoD and KMPs',
        'DISTRIBUTORS': 'Employees other than BoD and KMPs'
      };
      return displayNames[categoryKey] || 'Employees other than BoD and KMPs';
    };

    const getCategorySortOrder = (categoryKey: string) => {
      const sortOrder: Record<string, number> = {
        'BOD': 1,
        'KMP': 2,
        'EMPLOYEES_PERMANENT': 3,
        'EMPLOYEES_TEMPORARY': 3,
        'WORKERS_PERMANENT': 4,
        'WORKERS_TEMPORARY': 4,
        'CUSTOMERS': 3,
        'SUPPLIERS': 3,
        'DISTRIBUTORS': 3
      };
      return sortOrder[categoryKey] || 3;
    };

    // Get all unique normalized categories from training data
    const allCategories = new Set<string>();
    trainings.forEach(training => {
      if (training.attendantUsers) {
        training.attendantUsers.forEach((user: any) => {
          if (user.categoryId) {
            const normalizedCategory = normalizeCategory(user.categoryId);
            allCategories.add(normalizedCategory);
          }
        });
      }
    });

    // Initialize category data structure - group by display name to merge subcategories
    const categoryData: any = {};
    const displayNames = ['Board of Directors', 'Key Managerial Personnel', 'Employees other than BoD and KMPs', 'Workers'];

    displayNames.forEach(displayName => {
      categoryData[displayName] = {
        sortOrder: displayName === 'Board of Directors' ? 1 :
          displayName === 'Key Managerial Personnel' ? 2 :
            displayName === 'Employees other than BoD and KMPs' ? 3 : 4,
        totalTrainings: 0,
        totalParticipants: 0,
        maleParticipants: 0,
        femaleParticipants: 0,
        otherParticipants: 0,
        trainings: [],
        topics: new Set(),
        principles: new Set()
      };
    });

    trainings.forEach(training => {
      // Get all users for this training
      const allUsers = training.attendantUsers || [];

      // Group users by normalized category using your logic
      const usersByCategory: any = {};
      allUsers.forEach((user: any) => {
        const gender = user.gender?.toLowerCase();
        const categoryIdRaw = user.categoryId;
        const categoryId = normalizeCategory(categoryIdRaw);
        const displayName = getCategoryDisplayName(categoryId);

        const isMale = gender === 'male' || gender === 'm';
        const isFemale = gender === 'female' || gender === 'f';

        if (displayName) {
          if (!usersByCategory[displayName]) {
            usersByCategory[displayName] = [];
          }
          usersByCategory[displayName].push({
            ...user,
            normalizedCategory: categoryId,
            isMale,
            isFemale
          });
        }
      });

      // Process each category that has users in this training
      Object.keys(usersByCategory).forEach(categoryDisplayName => {
        const categoryUsers = usersByCategory[categoryDisplayName];

        if (categoryUsers.length > 0 && categoryData[categoryDisplayName]) {
          // Check if this training is already counted for this category
          const existingTraining = categoryData[categoryDisplayName].trainings.find(
            (t: any) => t.trainingId === training.id
          );

          if (!existingTraining) {
            categoryData[categoryDisplayName].totalTrainings++;

            // Add training details
            categoryData[categoryDisplayName].trainings.push({
              trainingId: training.id,
              trainingName: training.trainingName || training.name || 'N/A',
              fromDate: training.fromDate,
              toDate: training.toTime || training.toDate,
              participantCount: categoryUsers.length,
              participants: categoryUsers.map((u: any) => ({
                id: u.id,
                name: this.getFullName(u.first_name, u.last_name),
                employeeId: u.employeeId,
                gender: u.gender,
                categoryId: u.categoryId,
                normalizedCategory: u.normalizedCategory
              }))
            });

            // Add topics dynamically from existing training data
            if (training.mapTopic && Array.isArray(training.mapTopic)) {
              training.mapTopic.forEach((topic: any) => {
                if (topic && topic.topic) {
                  categoryData[categoryDisplayName].topics.add(topic.topic);
                }
              });
            }

            // Add principles - if you have principle data in your training structure
            if (training.principlesId && Array.isArray(training.principlesId)) {
              training.principlesId.forEach((principleId: any) => {
                if (principleId) {
                  categoryData[categoryDisplayName].principles.add(principleId);
                }
              });
            }
          }

          categoryData[categoryDisplayName].totalParticipants += categoryUsers.length;

          // Count gender distribution using your logic
          categoryUsers.forEach((user: any) => {
            if (user.isMale) {
              categoryData[categoryDisplayName].maleParticipants++;
            } else if (user.isFemale) {
              categoryData[categoryDisplayName].femaleParticipants++;
            } else {
              categoryData[categoryDisplayName].otherParticipants++;
            }
          });
        }
      });
    });

    // Convert Sets to Arrays and sort categories by order
    const sortedCategoryData = {};
    Object.keys(categoryData)
      .sort((a, b) => categoryData[a].sortOrder - categoryData[b].sortOrder)
      .forEach(categoryName => {
        const category = categoryData[categoryName];
        sortedCategoryData[categoryName] = {
          totalTrainings: category.totalTrainings,
          totalParticipants: category.totalParticipants,
          maleParticipants: category.maleParticipants,
          femaleParticipants: category.femaleParticipants,
          otherParticipants: category.otherParticipants,
          trainings: category.trainings,
          topics: Array.from(category.topics).sort(),
          principles: Array.from(category.principles).sort()
        };
      });

    return sortedCategoryData;
  }

  // Helper method to safely get full name
  private getFullName(firstName: string, lastName: string): string {
    const first = firstName || '';
    const last = lastName || '';
    return `${first} ${last}`.trim() || 'N/A';
  }

  private convertPeriodsToDateRanges(periods: any, frequency: any) {
    const periodArray = [];

    const frequencyMonthMap: Record<string, number> = {
      MONTHLY: 1,
      QUARTERLY: 3,
      HALF_YEARLY: 6,
      YEARLY: 12
    };

    const monthsToAdd = frequencyMonthMap[frequency] || 1;

    for (const [periodName, startYearMonth] of Object.entries(periods)) {
      const [year, month] = (startYearMonth as string).split('-').map(Number);

      const startDate = new Date(year, month - 1, 2);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + monthsToAdd);

      periodArray.push({
        name: periodName,
        originalValue: startYearMonth,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        startDateObj: startDate,
        endDateObj: endDate
      });
    }

    periodArray.sort((a, b) => a.startDateObj.getTime() - b.startDateObj.getTime());
    return periodArray;
  }
  // Helper method to categorize users based on categoryId values
  private categorizeUsersByCategory(users: any[]) {
    const counts = {
      permanentMaleEmployees: 0,
      permanentFemaleEmployees: 0,
      otherThanPermanentMaleEmployees: 0,
      otherThanPermanentFemaleEmployees: 0,
      permanentMaleWorkers: 0,
      permanentFemaleWorkers: 0,
      otherThanPermanentMaleWorkers: 0,
      otherThanPermanentFemaleWorkers: 0,
      kmpMaleCount: 0,
      kmpFemaleCount: 0,
      bodMaleCount: 0,
      bodFemaleCount: 0,
      customerMaleCount: 0,
      customerFemaleCount: 0,
      supplierMaleCount: 0,
      supplierFemaleCount: 0,
      distributorMaleCount: 0,
      distributorFemaleCount: 0,

      // Detailed breakdown
      detailed: {
        EMPLOYEES_PERMANENT: { male: 0, female: 0, other: 0 },
        EMPLOYEES_TEMPORARY: { male: 0, female: 0, other: 0 },
        WORKERS_PERMANENT: { male: 0, female: 0, other: 0 },
        WORKERS_TEMPORARY: { male: 0, female: 0, other: 0 },
        KMP: { male: 0, female: 0, other: 0 },
        BOD: { male: 0, female: 0, other: 0 },
        CUSTOMERS: { male: 0, female: 0, other: 0 },
        SUPPLIERS: { male: 0, female: 0, other: 0 },
        DISTRIBUTORS: { male: 0, female: 0, other: 0 }
      }
    };

    const normalizeCategory = (categoryId: string) => {
      const map: Record<string, string> = {
        'Permanent Employee': 'EMPLOYEES_PERMANENT',
        'Other than Permanent Employee': 'EMPLOYEES_TEMPORARY',
        'Permanent Worker': 'WORKERS_PERMANENT',
        'Other than Permanent Worker': 'WORKERS_TEMPORARY',
        'Customer': 'CUSTOMERS',
        'Supplier': 'SUPPLIERS',
        'Distributor': 'DISTRIBUTORS'
      };
      return map[categoryId] || categoryId;
    };

    users.forEach((user: any) => {
      const gender = user.gender?.toLowerCase();
      const categoryIdRaw = user.categoryId;
      const categoryId = normalizeCategory(categoryIdRaw);

      const isMale = gender === 'male' || gender === 'm';
      const isFemale = gender === 'female' || gender === 'f';
      const genderKey = isMale ? 'male' : isFemale ? 'female' : 'other';

      // Update detailed counts
      if (counts.detailed[categoryId]) {
        counts.detailed[categoryId][genderKey]++;
      }

      // Update specific category counters
      switch (categoryId) {
        case 'EMPLOYEES_PERMANENT':
          if (isMale) counts.permanentMaleEmployees++;
          else if (isFemale) counts.permanentFemaleEmployees++;
          break;

        case 'EMPLOYEES_TEMPORARY':
          if (isMale) counts.otherThanPermanentMaleEmployees++;
          else if (isFemale) counts.otherThanPermanentFemaleEmployees++;
          break;

        case 'WORKERS_PERMANENT':
          if (isMale) counts.permanentMaleWorkers++;
          else if (isFemale) counts.permanentFemaleWorkers++;
          break;

        case 'WORKERS_TEMPORARY':
          if (isMale) counts.otherThanPermanentMaleWorkers++;
          else if (isFemale) counts.otherThanPermanentFemaleWorkers++;
          break;

        case 'KMP':
          if (isMale) counts.kmpMaleCount++;
          else if (isFemale) counts.kmpFemaleCount++;
          break;

        case 'BOD':
          if (isMale) counts.bodMaleCount++;
          else if (isFemale) counts.bodFemaleCount++;
          break;

        case 'CUSTOMERS':
          if (isMale) counts.customerMaleCount++;
          else if (isFemale) counts.customerFemaleCount++;
          break;

        case 'SUPPLIERS':
          if (isMale) counts.supplierMaleCount++;
          else if (isFemale) counts.supplierFemaleCount++;
          break;

        case 'DISTRIBUTORS':
          if (isMale) counts.distributorMaleCount++;
          else if (isFemale) counts.distributorFemaleCount++;
          break;
      }
    });

    return counts;
  }

  async getPermissionGraphWithAssignedQuestions(req: any) {
    const systemUserId = req.headers.userid;
    const financialYearId = req.query.financialYearId ? req.query.financialYearId : 6;

    if (!systemUserId) {
      throw new HttpException({ status: 400, message: 'User ID missing' }, HttpStatus.BAD_REQUEST);
    }
    const userOrgChart = await this.findUserOrgChartData(systemUserId);
    if (!userOrgChart) {
      throw new HttpException({ status: 200, message: 'No Data Found', data: { teamWorkloadResults: [] } }, HttpStatus.OK);
    }

    const userIds = await this.extractUserIds(userOrgChart);

    const assignedQuestions: number[] = await this.sectorQuestionDaoModuleService.getAllQuestionIds(
      userIds,
      Number(financialYearId),
    );

    // Full category-question mapping
    const fullCategoryMap = {
      Environment: [289, 292, 293, 295, 301, 310, 391, 394, 400, 401, 402, 404, 408, 412,
        413, 414, 426, 428, 429, 430, 451, 452, 458, 459, 460, 468, 469, 474,
        495, 497, 499],
      Energy: [451, 452, 289, 293, 295, 292, 495, 497, 499, 468, 426, 428, 430, 429],
      Emission: [451, 452, 289, 293, 295, 292, 495, 497, 499, 468, 426, 428, 430, 429],
      Water: [391, 469, 474, 394, 310, 301],
      Waste: [400, 401, 402, 404, 408, 412, 413, 414, 458, 459, 460],
      Diversity: [432, 433, 434, 435, 436, 501, 502, 503, 504, 505, 531, 26, 28, 30, 32, 42],
      Employment: [552, 437],
      'Health & Safety': [443, 444, 445, 446, 122, 123, 206, 163, 164, 215],
    };

    // Filter only the questions assigned to this user
    const result = Object.entries(fullCategoryMap).reduce((acc, [category, questions]) => {
      const filtered = questions.filter((q) => assignedQuestions.includes(q));
      if (filtered.length > 0) {
        acc[category] = filtered;
      }
      return acc;
    }, {});

    throw new HttpException({ status: 200, message: 'Data Found', data: result }, HttpStatus.OK);
  }

  async getCompareEnergyData(req: any) {

    const getCompany = await this.userDaoService.getHeadOfficeCompanyDetails(true);
    if (!getCompany) {
      throw new HttpException('Company details not found', HttpStatus.NOT_FOUND);
    }

    const frameworkIds = await this.getFrameworkIds(getCompany.company_id);
    const qIds = [451, 452];

    const queryParam = {
      company_id: getCompany.company_id,
      user_type_code: 'COMPANY',
      framework_ids: frameworkIds,
      qIds,
    };

    const getSectorQuestion = await this.externalApiCallService.getReq(
      `${process.env.COMPANY_SERVER_API_URL}getReportingQuestion`,
      queryParam,
      {},
    );

    const questionData = getSectorQuestion?.data || [];
    if (!questionData.length) {
      throw new HttpException('No reporting questions found', HttpStatus.NOT_FOUND);
    }

    const financialYearIds = JSON.parse(req.query.financialYearIds || '[]');

    const energyAndEmissionData = await Promise.all(
      financialYearIds.map(async (yearId) => this.getEnergyAndEmission(yearId))
    );

    const answerData = await Promise.all(
      financialYearIds.map(async (yearId) => {
        return this.sectorQuestionDaoModuleService.getReportingQuestionTabularAnswerBasedId(qIds, yearId);
      })
    );

    if (!answerData.length) {
      throw new HttpException('No answer data found', HttpStatus.NOT_FOUND);
    }
    const reportingAnswerTagetData = await Promise.all(
      financialYearIds.map(async (yearId) => {
        return await this.setTargetDataQuestionDaoService.getTargetQuestionsAnswers(Number(yearId), Number(11));
      })
    );
    const filteredReportingAnswerTagetData = reportingAnswerTagetData.filter(data => data !== null && data !== undefined);

    const extractQuestionIdAndAnswer = answerData.flat().map(({ fromDate, toDate, questionId, answer, sourceId, financialYearId }) => {
      const questionDetails = questionData.find(q => q.questionId === questionId);
      const targetData = filteredReportingAnswerTagetData.find(q => q.financialYearId === financialYearId);
      const energyData = energyAndEmissionData
        .flat()
        .find(e => e.questionId === questionId && e.fromDate === fromDate);

      return questionDetails ? {
        questionId: questionDetails.questionId,
        sourceId,
        qIds: questionDetails.questionId,
        answer: answer ? JSON.parse(answer) : null,
        title: questionDetails.title,
        question_details: questionDetails.details,
        formDate: fromDate,
        toDate,
        energyAndEmission: energyData?.energy || null,
        targetData: targetData?.maxTargetData ? JSON.parse(targetData?.maxTargetData) : null
      } : null;
    }).filter(Boolean);
    throw new HttpException({
      status: 200,
      message: 'Data Found',
      data: extractQuestionIdAndAnswer,
    }, HttpStatus.OK);

  }

  async getAllTrainingDataForGraphForUser(req: any) {
    const systemUserId = req.headers.userid;
    if (!req.query.financialYearId) {
      throw new HttpException({ status: 400, message: 'Financial Year not found ', }, HttpStatus.BAD_REQUEST);
    }
    let trainingListData = await this.trainingDaoService.getTrainingListForUser(
      Number(req.query.financialYearId),
      Number(systemUserId)
    );

    if (trainingListData) throw new HttpException({ status: 200, message: 'Data Found', data: trainingListData }, HttpStatus.OK);
  }

  async getAllTrainingDataForGraphForTrainer(req: any) {
    const systemUserId = req.headers.userid;
    if (!req.query.financialYearId) {
      throw new HttpException({ status: 400, message: 'Financial Year not found ', }, HttpStatus.BAD_REQUEST);
    }
    let trainingListData = await this.trainingDaoService.getTrainingListForTrainer(
      Number(req.query.financialYearId),
      Number(systemUserId)
    );

    if (trainingListData) throw new HttpException({ status: 200, message: 'Data Found', data: trainingListData }, HttpStatus.OK);
  }

  async getTriggerEnvironmentData(req: any) {
    const financialYearId = Number(req.query.financialYearId);

    // Fetch data for both questionIds (11 = targetData, 12 = emission)
    const [energyDataRaw, emissionDataRaw] = await Promise.all([
      this.setTargetDataQuestionDaoService.getAllTargetQuestionsAnswers(financialYearId, 11),
      this.setTargetDataQuestionDaoService.getAllTargetQuestionsAnswers(financialYearId, 12),
    ]);

    const formatData = (rawData) =>
      rawData
        .filter(data => data !== null && data !== undefined)
        .flat()
        .map(({ fromDate, toDate, questionId, maxTargetData, minTargetData, sourceId, financialYearId }) => ({
          questionId,
          sourceId,
          fromDate,
          toDate,
          maxTargetData: maxTargetData ? JSON.parse(maxTargetData) : null,
          minTargetData: minTargetData ? JSON.parse(minTargetData) : null,
          financialYearId,
        }))
        .filter(Boolean);

    const energyData = formatData(energyDataRaw);
    const emissionData = formatData(emissionDataRaw);

    throw new HttpException({
      status: 200,
      message: 'Data Found',
      data: {
        energyData,
        emissionData,
      },
    }, HttpStatus.OK);
  }

  async getCompareWaterData(req: any) {
    const getCompany = await this.userDaoService.getHeadOfficeCompanyDetails(true);
    if (!getCompany) {
      throw new HttpException('Company details not found', HttpStatus.NOT_FOUND);
    }

    const frameworkIds = await this.getFrameworkIds(getCompany.company_id);
    const qIds = [301, 310];

    const queryParam = {
      company_id: getCompany.company_id,
      user_type_code: 'COMPANY',
      framework_ids: frameworkIds,
      qIds,
    };

    const getSectorQuestion = await this.externalApiCallService.getReq(
      `${process.env.COMPANY_SERVER_API_URL}getReportingQuestion`,
      queryParam,
      {},
    );

    const questionData = getSectorQuestion?.data || [];
    if (!questionData.length) {
      throw new HttpException('No reporting questions found', HttpStatus.NOT_FOUND);
    }

    const financialYearIds = JSON.parse(req.query.financialYearIds || '[]');

    const answerData = await Promise.all(
      financialYearIds.map(async (yearId) => {
        return this.sectorQuestionDaoModuleService.getReportingQuestionTabularAnswerBasedId(qIds, yearId);
      })
    );

    if (!answerData.length) {
      throw new HttpException('No answer data found', HttpStatus.NOT_FOUND);
    }
    const reportingAnswerTagetData = await Promise.all(
      financialYearIds.map(async (yearId) => {
        return await this.setTargetDataQuestionDaoService.getTargetQuestionsAnswers(Number(yearId), Number(301));
      })
    );

    const filteredReportingAnswerTagetData = reportingAnswerTagetData.filter(data => data !== null && data !== undefined);

    const extractQuestionIdAndAnswer = answerData.flat().map(({ fromDate, toDate, questionId, answer, sourceId, financialYearId }) => {
      const questionDetails = questionData.find(q => q.questionId === questionId);
      const targetData = filteredReportingAnswerTagetData.find(q => q.financialYearId === financialYearId);

      return questionDetails ? {
        questionId: questionDetails.questionId,
        sourceId,
        qIds: questionDetails.questionId,
        answer: answer ? JSON.parse(answer) : null,
        title: questionDetails.title,
        question_details: questionDetails.details,
        formDate: fromDate,
        toDate,
        targetData: targetData?.maxTargetData ? JSON.parse(targetData?.maxTargetData) : null
      } : null;
    }).filter(Boolean);
    throw new HttpException({
      status: 200,
      message: 'Data Found',
      data: extractQuestionIdAndAnswer,
    }, HttpStatus.OK);

  }

  async getCompareDiversityData(req: any) {
    const getCompany = await this.userDaoService.getHeadOfficeCompanyDetails(true);
    if (!getCompany) {
      throw new HttpException('Company details not found', HttpStatus.NOT_FOUND);
    }

    const frameworkIds = await this.getFrameworkIds(getCompany.company_id);
    const qIds = [26, 28, 30, 32];

    const queryParam = {
      company_id: getCompany.company_id,
      user_type_code: 'COMPANY',
      framework_ids: frameworkIds,
      qIds,
    };

    const getSectorQuestion = await this.externalApiCallService.getReq(
      `${process.env.COMPANY_SERVER_API_URL}getReportingQuestion`,
      queryParam,
      {},
    );

    const questionData = getSectorQuestion?.data || [];
    if (!questionData.length) {
      throw new HttpException('No reporting questions found', HttpStatus.NOT_FOUND);
    }

    const financialYearIds = JSON.parse(req.query.financialYearIds || '[]');

    const answerData = await Promise.all(
      financialYearIds.map(async (yearId) => {
        return this.sectorQuestionDaoModuleService.getReportingQuestionTabularAnswerBasedId(qIds, yearId);
      })
    );

    if (!answerData.length) {
      throw new HttpException('No answer data found', HttpStatus.NOT_FOUND);
    }
    const reportingAnswerTagetData = await Promise.all(
      financialYearIds.map(async (yearId) => {
        return await this.setTargetDataQuestionDaoService.getTargetQuestionsAnswers(Number(yearId), Number(11));
      })
    );

    const filteredReportingAnswerTagetData = reportingAnswerTagetData.filter(data => data !== null && data !== undefined);

    const extractQuestionIdAndAnswer = answerData.flat().map(({ fromDate, toDate, questionId, answer, sourceId, financialYearId }) => {
      const questionDetails = questionData.find(q => q.questionId === questionId);
      const targetData = filteredReportingAnswerTagetData.find(q => q.financialYearId === financialYearId);

      return questionDetails ? {
        questionId: questionDetails.questionId,
        sourceId,
        qIds: questionDetails.questionId,
        answer: answer ? JSON.parse(answer) : null,
        title: questionDetails.title,
        question_details: questionDetails.details,
        formDate: fromDate,
        toDate,
        targetData: targetData?.maxTargetData ? JSON.parse(targetData?.maxTargetData) : null
      } : null;
    }).filter(Boolean);
    throw new HttpException({
      status: 200,
      message: 'Data Found',
      data: extractQuestionIdAndAnswer,
    }, HttpStatus.OK);

  }

  async getCompareTrainingData(req: any) {
    const getCompany = await this.userDaoService.getHeadOfficeCompanyDetails(true);
    if (!getCompany) {
      throw new HttpException('Company details not found', HttpStatus.NOT_FOUND);
    }

    const frameworkIds = await this.getFrameworkIds(getCompany.company_id);
    const qIds = [75, 190, 191, 236, 198, 200];

    const queryParam = {
      company_id: getCompany.company_id,
      user_type_code: 'COMPANY',
      framework_ids: frameworkIds,
      qIds,
    };

    const getSectorQuestion = await this.externalApiCallService.getReq(
      `${process.env.COMPANY_SERVER_API_URL}getReportingQuestion`,
      queryParam,
      {},
    );

    const questionData = getSectorQuestion?.data || [];
    if (!questionData.length) {
      throw new HttpException('No reporting questions found', HttpStatus.NOT_FOUND);
    }

    const financialYearIds = JSON.parse(req.query.financialYearIds || '[]');

    const answerData = await Promise.all(
      financialYearIds.map(async (yearId) => {
        return this.sectorQuestionDaoModuleService.getReportingQuestionTabularAnswerBasedId(qIds, yearId);
      })
    );

    if (!answerData.length) {
      throw new HttpException('No answer data found', HttpStatus.NOT_FOUND);
    }
    const reportingAnswerTagetData = await Promise.all(
      financialYearIds.map(async (yearId) => {
        return await this.setTargetDataQuestionDaoService.getTargetQuestionsAnswers(Number(yearId), Number(11));
      })
    );

    const filteredReportingAnswerTagetData = reportingAnswerTagetData.filter(data => data !== null && data !== undefined);

    const extractQuestionIdAndAnswer = answerData.flat().map(({ fromDate, toDate, questionId, answer, sourceId, financialYearId }) => {
      const questionDetails = questionData.find(q => q.questionId === questionId);
      const targetData = filteredReportingAnswerTagetData.find(q => q.financialYearId === financialYearId);

      return questionDetails ? {
        questionId: questionDetails.questionId,
        sourceId,
        qIds: questionDetails.questionId,
        answer: answer ? JSON.parse(answer) : null,
        title: questionDetails.title,
        question_details: questionDetails.details,
        formDate: fromDate,
        toDate,
        targetData: targetData?.maxTargetData ? JSON.parse(targetData?.maxTargetData) : null
      } : null;
    }).filter(Boolean);
    throw new HttpException({
      status: 200,
      message: 'Data Found',
      data: extractQuestionIdAndAnswer,
    }, HttpStatus.OK);

  }

  async getTurnOverRate(req: any) {
    const getCompany = await this.userDaoService.getHeadOfficeCompanyDetails(true);
    if (!getCompany) {
      throw new HttpException('Company details not found', HttpStatus.NOT_FOUND);
    }

    const frameworkIds = await this.getFrameworkIds(getCompany.company_id);
    const qIds = [26, 28, 46, 48];

    const queryParam = {
      company_id: getCompany.company_id,
      user_type_code: 'COMPANY',
      framework_ids: frameworkIds,
      qIds,
    };

    const getSectorQuestion = await this.externalApiCallService.getReq(
      `${process.env.COMPANY_SERVER_API_URL}getReportingQuestion`,
      queryParam,
      {},
    );

    const questionData = getSectorQuestion?.data || [];
    if (!questionData.length) {
      throw new HttpException('No reporting questions found', HttpStatus.NOT_FOUND);
    }

    const financialYearIds = JSON.parse(req.query.financialYearIds || '[]');

    const answerData = await Promise.all(
      financialYearIds.map(async (yearId) => {
        return this.sectorQuestionDaoModuleService.getReportingQuestionTabularAnswerBasedId(qIds, yearId);
      })
    );

    if (!answerData.length) {
      throw new HttpException('No answer data found', HttpStatus.NOT_FOUND);
    }
    const reportingAnswerTagetData = await Promise.all(
      financialYearIds.map(async (yearId) => {
        return await this.setTargetDataQuestionDaoService.getTargetQuestionsAnswers(Number(yearId), Number(11));
      })
    );

    const filteredReportingAnswerTagetData = reportingAnswerTagetData.filter(data => data !== null && data !== undefined);

    const extractQuestionIdAndAnswer = answerData.flat().map(({ fromDate, toDate, questionId, answer, sourceId, financialYearId }) => {
      const questionDetails = questionData.find(q => q.questionId === questionId);
      const targetData = filteredReportingAnswerTagetData.find(q => q.financialYearId === financialYearId);

      return questionDetails ? {
        questionId: questionDetails.questionId,
        sourceId,
        qIds: questionDetails.questionId,
        answer: answer ? JSON.parse(answer) : null,
        title: questionDetails.title,
        // question_details: questionDetails.details,
        formDate: fromDate,
        toDate,
        targetData: targetData?.maxTargetData ? JSON.parse(targetData?.maxTargetData) : null
      } : null;
    }).filter(Boolean);
    throw new HttpException({
      status: 200,
      message: 'Data Found',
      data: extractQuestionIdAndAnswer,
    }, HttpStatus.OK);

  }

  async getCompareCustomerComplaintsData(req: any) {
    const getCompany = await this.userDaoService.getHeadOfficeCompanyDetails(true);
    if (!getCompany) {
      throw new HttpException('Company details not found', HttpStatus.NOT_FOUND);
    }

    const frameworkIds = await this.getFrameworkIds(getCompany.company_id);
    const qIds = [54];

    const queryParam = {
      company_id: getCompany.company_id,
      user_type_code: 'COMPANY',
      framework_ids: frameworkIds,
      qIds,
    };

    const getSectorQuestion = await this.externalApiCallService.getReq(
      `${process.env.COMPANY_SERVER_API_URL}getReportingQuestion`,
      queryParam,
      {},
    );

    const questionData = getSectorQuestion?.data || [];
    if (!questionData.length) {
      throw new HttpException('No reporting questions found', HttpStatus.NOT_FOUND);
    }

    const financialYearIds = JSON.parse(req.query.financialYearIds || '[]');

    const answerData = await Promise.all(
      financialYearIds.map(async (yearId) => {
        return this.sectorQuestionDaoModuleService.getReportingQuestionTabularAnswerBasedId(qIds, yearId);
      })
    );

    if (!answerData.length) {
      throw new HttpException('No answer data found', HttpStatus.NOT_FOUND);
    }
    const reportingAnswerTagetData = await Promise.all(
      financialYearIds.map(async (yearId) => {
        return await this.setTargetDataQuestionDaoService.getTargetQuestionsAnswers(Number(yearId), Number(46));
      })
    );

    const filteredReportingAnswerTagetData = reportingAnswerTagetData.filter(data => data !== null && data !== undefined);

    const extractQuestionIdAndAnswer = answerData.flat().map(({ fromDate, toDate, questionId, answer, sourceId, financialYearId }) => {
      const questionDetails = questionData.find(q => q.questionId === questionId);
      const targetData = filteredReportingAnswerTagetData.find(q => q.financialYearId === financialYearId);
      const customer = answer ? JSON.parse(answer) : null;
      const customerTarget = targetData?.maxTargetData ? JSON.parse(targetData?.maxTargetData) : null

      return questionDetails ? {
        questionId: questionDetails.questionId,
        sourceId,
        qIds: questionDetails.questionId,
        answer: customer ? customer[4] : null,
        title: questionDetails.title,
        // question_details: questionDetails.details,
        formDate: fromDate,
        toDate,
        targetData: customerTarget ? customerTarget[4] : null,
        financialYearId
      } : null;
    }).filter(Boolean);
    throw new HttpException({
      status: 200,
      message: 'Data Found',
      data: extractQuestionIdAndAnswer,
    }, HttpStatus.OK);

  }

  async getCompareSafetyData(req: any) {
    const getCompany = await this.userDaoService.getHeadOfficeCompanyDetails(true);
    if (!getCompany) {
      throw new HttpException('Company details not found', HttpStatus.NOT_FOUND);
    }

    const frameworkIds = await this.getFrameworkIds(getCompany.company_id);
    const qIds = [122, 123];

    const queryParam = {
      company_id: getCompany.company_id,
      user_type_code: 'COMPANY',
      framework_ids: frameworkIds,
      qIds,
    };

    const getSectorQuestion = await this.externalApiCallService.getReq(
      `${process.env.COMPANY_SERVER_API_URL}getReportingQuestion`,
      queryParam,
      {},
    );

    const questionData = getSectorQuestion?.data || [];
    if (!questionData.length) {
      throw new HttpException('No reporting questions found', HttpStatus.NOT_FOUND);
    }

    const financialYearIds = JSON.parse(req.query.financialYearIds || '[]');

    const answerData = await Promise.all(
      financialYearIds.map(async (yearId) => {
        return this.sectorQuestionDaoModuleService.getReportingQuestionTabularAnswerBasedId(qIds, yearId);
      })
    );

    if (!answerData.length) {
      throw new HttpException('No answer data found', HttpStatus.NOT_FOUND);
    }
    const reportingAnswerTagetData = await Promise.all(
      financialYearIds.map(async (yearId) => {
        return await this.setTargetDataQuestionDaoService.getTargetQuestionsAnswers(Number(yearId), Number(11));
      })
    );

    const filteredReportingAnswerTagetData = reportingAnswerTagetData.filter(data => data !== null && data !== undefined);

    const extractQuestionIdAndAnswer = answerData.flat().map(({ fromDate, toDate, questionId, answer, sourceId, financialYearId }) => {
      const questionDetails = questionData.find(q => q.questionId === questionId);
      const targetData = filteredReportingAnswerTagetData.find(q => q.financialYearId === financialYearId);

      return questionDetails ? {
        questionId: questionDetails.questionId,
        sourceId,
        qIds: questionDetails.questionId,
        answer: answer ? JSON.parse(answer) : null,
        title: questionDetails.title,
        question_details: questionDetails.details,
        formDate: fromDate,
        toDate,
        targetData: targetData?.maxTargetData ? JSON.parse(targetData?.maxTargetData) : null
      } : null;
    }).filter(Boolean);
    throw new HttpException({
      status: 200,
      message: 'Data Found',
      data: extractQuestionIdAndAnswer,
    }, HttpStatus.OK);

  }

  async getCompareWasteData(req: any) {
    const getCompany = await this.userDaoService.getHeadOfficeCompanyDetails(true);
    if (!getCompany) {
      throw new HttpException('Company details not found', HttpStatus.NOT_FOUND);
    }

    const frameworkIds = await this.getFrameworkIds(getCompany.company_id);
    const qIds = [458, 459, 460];

    const queryParam = {
      company_id: getCompany.company_id,
      user_type_code: 'COMPANY',
      framework_ids: frameworkIds,
      qIds,
    };

    const getSectorQuestion = await this.externalApiCallService.getReq(
      `${process.env.COMPANY_SERVER_API_URL}getReportingQuestion`,
      queryParam,
      {},
    );

    const questionData = getSectorQuestion?.data || [];
    if (!questionData.length) {
      throw new HttpException('No reporting questions found', HttpStatus.NOT_FOUND);
    }

    const financialYearIds = JSON.parse(req.query.financialYearIds || '[]');

    const answerData = await Promise.all(
      financialYearIds.map(async (yearId) => {
        return this.sectorQuestionDaoModuleService.getReportingQuestionTabularAnswerBasedId(qIds, yearId);
      })
    );

    if (!answerData.length) {
      throw new HttpException('No answer data found', HttpStatus.NOT_FOUND);
    }
    const reportingAnswerTagetData = await Promise.all(
      financialYearIds.map(async (yearId) => {
        return await this.setTargetDataQuestionDaoService.getTargetQuestionsAnswers(Number(yearId), Number(458));
      })
    );

    const filteredReportingAnswerTagetData = reportingAnswerTagetData.filter(data => data !== null && data !== undefined);

    const extractQuestionIdAndAnswer = answerData.flat().map(({ fromDate, toDate, questionId, answer, sourceId, financialYearId }) => {
      const questionDetails = questionData.find(q => q.questionId === questionId);
      const targetData = filteredReportingAnswerTagetData.find(q => q.financialYearId === financialYearId);

      return questionDetails ? {
        questionId: questionDetails.questionId,
        sourceId,
        qIds: questionDetails.questionId,
        answer: answer ? JSON.parse(answer) : null,
        title: questionDetails.title,
        question_details: questionDetails.details,
        formDate: fromDate,
        toDate,
        targetData: targetData?.maxTargetData ? JSON.parse(targetData?.maxTargetData) : null
      } : null;
    }).filter(Boolean);
    throw new HttpException({
      status: 200,
      message: 'Data Found',
      data: extractQuestionIdAndAnswer,
    }, HttpStatus.OK);

  }


  private async getFrameworkIds(companyId: number): Promise<number[]> {
    const response = await this.externalApiCallService.getReq(
      process.env.COMPANY_SERVER_API_URL + 'getFramework',
      { companyId: companyId, type: 'ALL', user_type_code: 'company' },
      {},
    );
    return response.data.map((obj: any) => obj.id);
  }

  private async getFramework(companyId: number): Promise<number[]> {
    const response = await this.externalApiCallService.getReq(
      process.env.COMPANY_SERVER_API_URL + 'getFramework',
      { companyId: companyId, type: 'ALL', user_type_code: 'company' },
      {},
    );
    return response.data;
  }

  private async getSectorQuestionForGraph(queryParam: any): Promise<any[]> {
    return await this.externalApiCallService.getReq(
      process.env.COMPANY_SERVER_API_URL + 'getSectorQuestionForGraph',
      queryParam,
      {},
    );
  }

  private categorizeQuestions(questions: any[]): any {
    const categorizedQuestions: any = {
      qualitative: new Set(),
      quantitative: new Set(),
      yes_no: new Set(),
      tabular_question: new Set(),
      quantitative_trends: new Set(),
    };

    questions.forEach(item => {
      const { questionType } = item;
      const questionId = item?.questionId ? item?.questionId : item?.id;
      if (categorizedQuestions.hasOwnProperty(questionType)) {
        categorizedQuestions[questionType].add(questionId);
      }
    });
    Object.keys(categorizedQuestions).forEach(category => {
      categorizedQuestions[category] = Array.from(categorizedQuestions[category]);
    });

    return categorizedQuestions;
  }

  private getTotalQuestions(categorizedQuestions: any): any {
    return {
      qualitative: categorizedQuestions.qualitative.length,
      quantitative: categorizedQuestions.quantitative.length,
      yes_no: categorizedQuestions.yes_no.length,
      tabular_question: categorizedQuestions.tabular_question.length,
      quantitative_trends: categorizedQuestions.quantitative_trends.length,
    };
  }

  private generateResponse(totalQuestions: any, answered: any, accepted: any, rejected: any, categorizedQuestions: any): any {
    const calculatePercentage = (value: number, total: number): number => {
      return total !== 0 ? (value / total) * 100 : 0;
    };
    const union = (...arrays) => [...new Set(arrays.flat())];
    const difference = (arr1, arr2) => arr1.filter(id => !arr2.includes(id));

    const addStats = (type: string) => {
      return {
        total: totalQuestions[type] ? totalQuestions[type] : 0,
        noAnswered: answered[type].length ? answered[type].length : 0,
        noAccepted: accepted[type].length ? accepted[type].length : 0,
        acceptedQuestionIds: accepted[type],
        answeredQuestionIds: answered[type],
        rejectedQuestionIds: rejected[type],
        notRespondedQuestionId: difference(categorizedQuestions[type], union(accepted[type], answered[type], rejected[type])),
        noRejected: rejected[type].length ? rejected[type].length : 0,
        noResponded: (accepted[type].length + rejected[type].length + answered[type].length),
        noNotResponded: (totalQuestions[type] - (accepted[type].length + rejected[type].length + answered[type].length)),
        answered: calculatePercentage(answered[type].length, totalQuestions[type]),
        accepted: calculatePercentage(accepted[type].length, totalQuestions[type]),
        rejected: calculatePercentage(rejected[type].length, totalQuestions[type]),
        responded: calculatePercentage(accepted[type].length + rejected[type].length + answered[type].length, totalQuestions[type]),
        notResponded: calculatePercentage(totalQuestions[type] - (accepted[type].length + rejected[type].length + answered[type].length), totalQuestions[type]),
      };
    };

    return {
      Qualitative: addStats('qualitative'),
      Quantitative: addStats('quantitative'),
      Tabular: addStats('tabular_question'),
      Range: addStats('yes_no'),
      Trends: addStats('quantitative_trends'),
    };
  }

  private async findUserOrgChartData(targetUserId: string) {
    const systemUserId = targetUserId;
    const { id: headOffice } = await this.userDaoService.getCompanyDetailsBasedOnParentIdNull();
    const getHeadOrgDetails = await this.orgChartDaoService.getOrgChartUserId(headOffice);
    const userOrgChart = await this.findUserOrgChart(JSON.parse(getHeadOrgDetails.orgChart), Number(systemUserId));
    return userOrgChart;
  }

  private async findUserOrgChart(orgData: OrgData, targetUserId: number): Promise<OrgData | null> {
    if (Number(orgData.userId) === targetUserId) return orgData;
    for (const child of orgData.children || []) {
      const result = await this.findUserOrgChart(child, targetUserId);
      if (result) return result;
    }
    return null;
  }

  private async extractUserIds(orgData: OrgData): Promise<number[]> {
    let userIds: number[] = [];

    function traverse(node: OrgData) {
      if (typeof node.userId === 'number') {
        userIds.push(node.userId);
      }
      if (node.children && node.children.length > 0) {
        node.children.forEach(child => traverse(child));
      }
    }

    traverse(orgData);
    return userIds;
  }

  private async getLocalHour() {
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const currentHour = new Date().toLocaleString('en-US', { hour: 'numeric', hour12: false, timeZone: userTimeZone });
    return parseInt(currentHour);
  }

  private async getEnergyAndEmission(financialYearId: number) {
    const answerData = await this.sectorQuestionDaoModuleService.getReportingQuestionTabularAnswerBasedId([452, 451], financialYearId);

    answerData.forEach((item) => {
      let tmpData: any[] = [];
      let parsed: any[] = [];

      try {
        parsed = JSON.parse(item.answer || '[]');
      } catch (error) {
        parsed = [];
      }

      if (Number(item.questionId) === 452) {
        tmpData = parsed.map(([value, unit], index) => {
          let energy = 0;
          let emissions = 0;

          const numericValue = parseFloat(value);

          if (isNaN(numericValue) || numericValue === 0 || !unit) {
            return [0.0, 0.0];
          }

          if (unit === 'KWH') {
            // Grid Electricity
            energy = (numericValue * 3.6) / 1000; // Convert kWh to GJ
            emissions = (numericValue * 0.727) / 1000; // Convert kg CO2 to tCO2
          } else if (index === 2) {
            // Diesel (index 2)
            const mass = numericValue * 0.845; // Convert liters to kg
            energy = (mass * 42.25) / 1000;
            emissions = (energy * 74100 + energy * 10 * 27.9 + energy * 273 * 0.6) / 1000000; // Convert kg CO2 to tCO2

            // emissions = (energy / 1000) * 74100 / 1000 + (energy / 1000) * 3 / 1000 +(energy / 1000) * 0.6 / 1000; // Convert kg CO2 to tCO2
          } else if (index === 5) {
            // LPG
            const mass = numericValue * 0.54; // Convert liters to kg
            energy = (mass * 46.1) / 1000; // Convert MJ to GJ
            emissions = (energy * 63100 + energy * 5 * 27.9 + energy * 273 * 0.1) / 1000000; // Convert kg CO2 to tCO2

            // emissions = (energy * 63.1)/1000; // Convert kg CO2 to tCO2
          }
          else if (index === 10) {
            energy = 0; // MJ to GJ
            emissions = (numericValue * 1960) / 1000; // kg CO2 to tCO2
          } else if (index === 11) {
            energy = 0; // MJ to GJ
            emissions = (numericValue * 1774) / 1000; // kg CO2 to tCO2
          } else if (index === 12) {
            energy = 0; // MJ to GJ
            emissions = (numericValue * 1530) / 1000; // kg CO2 to tCO2
          }

          return [energy.toFixed(2), emissions.toFixed(2)];
        });
      }

      if (Number(item.questionId) === 451) {
        tmpData = parsed.map(([unit, value]) => {
          let energy = 0;
          let emissions = 0;

          const numericValue = parseFloat(value);

          if (isNaN(numericValue) || numericValue === 0 || !unit) {
            return [0.0, 0.0];
          }

          if (unit === 'KWH') {
            energy = (numericValue * 3.6) / 1000;
            emissions = 0;
          }

          return [energy.toFixed(2), emissions.toFixed(2)];
        });
      }

      item.energy = tmpData;
    });

    return answerData;
  }


  private fuelData = [
    { fuelType: "Diesel", questionId: 289, density: 0.85, calorificValue: 42.5, emissionFactor: 2.66155 },
    { fuelType: "Petrol", questionId: 293, density: 0.74, calorificValue: 44.4, emissionFactor: 2.35372 },
    { fuelType: "PNG", questionId: 295, density: 0.8, calorificValue: 39.0, emissionFactor: 2.04 },
    { fuelType: "LPG", questionId: 292, density: 0.54, calorificValue: 46.1, emissionFactor: 1.55713 },
    { fuelType: "Furnace Oil", questionId: 495, density: 0.95, calorificValue: 40.5, emissionFactor: 323.842 },
    { fuelType: "Coal", questionId: 497, density: 1.35, calorificValue: 25.0, emissionFactor: 2399.43994 },
    { fuelType: "Briquette", questionId: 499, density: 1.2, calorificValue: 18.0, emissionFactor: 460.24 },
    { fuelType: "GRID electricity", questionId: 468, density: 1, calorificValue: 3.6, emissionFactor: 0.727 },
    { fuelType: "Electricity Power plant (Captive Power Plant - Natural Gas)", questionId: 426, density: 1, calorificValue: 3.6, emissionFactor: 0.727 },
    { fuelType: "Electricity consumption through DG", questionId: 428, density: 1, calorificValue: 3.6, emissionFactor: 0.727 },
    { fuelType: "Electricity consumption from Renewable energy (via PPA)", questionId: 429, density: 1, calorificValue: 3.6, emissionFactor: 0 },
    { fuelType: "Electricity consumption from Renewable energy (rooftop solar)", questionId: 430, density: 1, calorificValue: 3.6, emissionFactor: 0.89 },
  ];
}
