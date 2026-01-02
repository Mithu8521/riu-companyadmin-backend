import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { AiDashboardDaoService } from '../dao/ai_dashboard-dao/ai_dashboard-dao.service';
import { UserDaoService } from '../dao/setting/user-dao/user-dao.service';
import { ExternalApiCallService } from '@app/utils/common/external-api-call/external-api-call.service';
import { SectorQuestionDaoModuleService } from '../dao/sector-question-dao-module/sector-question-dao-module.service';
import { CreatePublishGraphDto } from './dto/create-publish-graph.dto';
import { GraphCategoryTypeEnum } from '@app/utils/enums/Status';
import { OrgChartDaoService } from '../dao/setting/org-chart-dao/org-chart-dao.service';
import { TrainingDaoService } from '../dao/training/training-dao/training-dao.service';
import { SuperAdminClientService } from '../super-admin-client/super-admin-client.service';
import { CommonUtilityService } from '@app/utils/common/common-utility/common-utility.service';

interface OrgData {
  userId: string;
  orgChart?: any;
  children?: OrgData[];
}


@Injectable()
export class AiDashboardService {
  constructor(
    private readonly aiDashboardDaoService: AiDashboardDaoService,
    private userDaoService: UserDaoService,
    private externalApiCallService: ExternalApiCallService,
    private sectorQuestionDaoModuleService: SectorQuestionDaoModuleService,
    private orgChartDaoService: OrgChartDaoService,
    private trainingDaoService: TrainingDaoService,
    private superAdminClientService: SuperAdminClientService,
    private commonUtilityService: CommonUtilityService,
  ) { }


  async createFromQuery(req: any) {
    try {
      const systemUserId = req.headers.userid;
      const company = await this.userDaoService.getHeadOfficeCompanyDetails(true);
      const companyId = company.company_id;
      const query = req.query.userInput || 'Show me Fuel consumption KPI WISE for the financial year 2024-2025 for all quarters';

      const userOrgChart = await this.findUserOrgChartData(systemUserId);
      if (!userOrgChart) {
        throw new HttpException({ status: 200, message: 'No Data Found', data: { teamWorkloadResults: [] } }, HttpStatus.OK);
      }
      const userIds = await this.extractUserIds(userOrgChart);

      const assignedQuestions: number[] = await this.sectorQuestionDaoModuleService.getAllQuestionId(
        userIds,
      );

      const allData = company.head_office ? await this.aiDashboardDaoService.getAllDashboardData() : await this.aiDashboardDaoService.getAllDashboardDataBasedOnIds(assignedQuestions);

      if (!allData || allData.length === 0) {
        throw new Error('No data available from dashboard service');
      }
      let plan_type;

      if (req.query.model === 'free') {
        plan_type = 'free';
      } else {
        plan_type = 'paid';
      }

      const uniqueValues = this.extractUniqueValues(allData);
      const queryParamForScript = {
        companyId: companyId,
        userId: systemUserId,
        query: query,
        plan_type: plan_type,
        provider: req.query.model,
        uniqueValues: JSON.stringify(uniqueValues),
      };

      const getGraphQuestionMapping = await this.externalApiCallService.getReq(
        process.env.COMPANY_SERVER_API_URL + 'graph/script',
        queryParamForScript,
        {},
      );

      if (!getGraphQuestionMapping.success) {
        return {
          isSuccess: false,
          message: getGraphQuestionMapping?.error,
        };
      }

      const script = getGraphQuestionMapping.data.script;
      const promptHistoryId = getGraphQuestionMapping.data.promptHistoryId;
      const companyPlateform = process.env.PLATEFORM_NAME;
      let body = { script: script, companyId: companyPlateform };
      const responseData = await this.externalApiCallService.postReq({}, body, process.env.SCRIPT_RUNNER_SERVICE_API_URL + 'runScript');
      const output = responseData.result;
      if (!output || typeof output !== 'object') {
        throw new Error('Invalid script output: result must be an object');
      }

      if (!output.graphType) {
        output.graphType = 'bar';
      }

      if (!output.graphCategory) {
        output.graphCategory = GraphCategoryTypeEnum.ENVIRONMENT;
      }

      if (!output.colors || !Array.isArray(output.colors)) {
        output.colors = ['#10b981', '#059669', '#047857'];
      }

      const data = {
        userId: systemUserId,
        query: query,
        script: script,
        promptHistoryId: promptHistoryId,
        response: typeof output === "object" ? JSON.stringify(output) : output,
      };

      const savedData = await this.aiDashboardDaoService.savePromptData(data);
      return {
        isSuccess: true,
        message: 'Chart data generated successfully',
        data: savedData
      };

    } catch (error: any) {
      console.error("error is coming", error)
      return {
        isSuccess: false,
        message: error.message || 'Failed to generate chart data',
        data: null
      };
    }
  }

  async availableProviders(req: any) {
    try {
      const systemUserId = req.headers.userid;
      const company = await this.userDaoService.getHeadOfficeCompanyDetails(true);
      const companyId = company.company_id;

      const queryParamForCheck = {
        companyId: companyId,
        userId: systemUserId,
      };

      const availableProviders = await this.externalApiCallService.getReq(
        process.env.COMPANY_SERVER_API_URL + 'graph/availableProviders',
        queryParamForCheck,
        {},
      );

      return {
        isSuccess: true,
        message: 'Available Providers fetch successfully',
        data: availableProviders.data
      };

    } catch (error: any) {
      return {
        isSuccess: false,
        message: error.message || 'Failed to generate chart data',
        data: null
      };
    }
  }

  async graphHistoryData(req: any) {
    try {
      const systemUserId = req.headers.userid;
      const allData = await this.aiDashboardDaoService.getAllHistoryData(Number(systemUserId));
      return {
        isSuccess: true,
        message: 'Chart data fetched successfully',
        data: allData
      };
    } catch (error: any) {
      return {
        isSuccess: false,
        message: error.message || 'Failed to fetched history',
        data: null
      };
    }
  }

  


  private async getTrainingAggregatedData(
    trainingCategories: any[],
    trainingRecords: any[],
    financialYears: { id: number; financial_year_value: string }[],
    trainingPrinciples: any[],
    startMonthIdx: number,
  ): Promise<any[]> {

    const categoryMap = new Map<number, string>(trainingCategories.map(c => [c.id, c.title]));
    const principleMap = new Map<number, string>(trainingPrinciples.map(p => [p.id, p.title]));

    const startMonth = startMonthIdx - 1;


    const fyDetailsMap = new Map<number, {startFy:any,endFy:any ,from: string; to: string; endTS: number; fyVal: string }>();
    financialYears.forEach(fy => {
      const [startYear, endYear] = fy.financial_year_value.split("-").map(Number);
      const reportFrom = `${startYear}-${String(startMonth).padStart(2, '0')}`;
      const endMonth = (startMonth + 11) % 12;
      const reportTo = `${endYear}-${String(endMonth).padStart(2, '0')}`;
      const fyEndDateValue = new Date(endYear, endMonth, 0, 23, 59, 59).getTime();
      const fromDate = new Date(startYear, startMonth, 1);
      const toDate = new Date(endYear, endMonth + 1, 0);

      fyDetailsMap.set(fy.id, { startFy:fromDate, endFy:toDate, from: reportFrom, to: reportTo, endTS: fyEndDateValue, fyVal: fy.financial_year_value });
    });   
  
    // 3. Pre-filter users into "Eligible per FY" Maps to avoid repeated filtering in the loop
    const fyEligibleUsersMap = new Map<number, any[]>();


    for (const [fyId, details] of fyDetailsMap.entries()) {
     
      const eligibleForThisFY:any =
        await this.userDaoService.getActiveUserForGivenFinancialYear(
          CommonUtilityService.formatDate(details.endFy),
        );
    
      fyEligibleUsersMap.set(fyId, eligibleForThisFY);
    }

    const normalizeSubCat = (cat?: string | null): string => {
      if (!cat) return 'NA';

      const c = cat.trim().toUpperCase();

      if (
        c === 'EMPLOYEES_PERMANENT' ||
        c === 'PERMANENT EMPLOYEE' ||
        c.includes('KMP') ||
        c.includes('BOD') ||
        c.includes("BOARD OF DIRECTORS")
      ) {
        return 'Permanent Employee';
      }

      if (
        c === 'EMPLOYEES_TEMPORARY' ||
        c === 'OTHER THAN PERMANENT EMPLOYEE'
      ) {
        return 'Other than Permanent Employee';
      }
      if (c.includes('PERMANENT WORKER')) { return 'PERMANENT WORKER'; }
      if (c.includes('OTHER THAN PERMANENT WORKER')) { return 'OTHER THAN PERMANENT WORKER'; }

      return c;
    };

  
    const trainingGroupDataMap = new Map<string, any>();
    
    // 4. Main Loop: Now only deals with Grouping
    for (const t of trainingRecords) {
      const fyDetails = fyDetailsMap.get(t.financialYearId);
      const eligibleUsersForFY = fyEligibleUsersMap.get(t.financialYearId) || [];
      if (!fyDetails || !eligibleUsersForFY.length) continue;

      const sessionAttendeeIds = new Set(CommonUtilityService.safeJsonParse<number[]>(t.attendantUserId) || []);
      const principles = CommonUtilityService.safeJsonParse<number[]>(t.principlesId) || [];
      let categories = CommonUtilityService.safeJsonParse<any>(t.categoryIds) || [];

      if (!sessionAttendeeIds.size ) continue;

      const actualAttendees = eligibleUsersForFY.filter(user => sessionAttendeeIds.has(user.id));        
      const updateMap = (primaryId: number, primaryName: string, isPrinciple: boolean) => {
        for (const trainee of actualAttendees) {
          const subCat = normalizeSubCat(trainee.categoryId);
          const key = [`${isPrinciple ? 'P' : 'C'}:${primaryId}`, t.financialYearId, t.locationId, subCat, trainee.gender, fyDetails.from, fyDetails.to].join(':');

          if (!trainingGroupDataMap.has(key)) {
            trainingGroupDataMap.set(key, {
              questionId: 9999, subQuestionId: 'T_AGGR', module: 'Training',
              category: primaryName, subCategory: subCat, kpi: trainee.gender,
              locationId: t.locationId, sublocationId: 0, financialYear: fyDetails.fyVal,
              fromDate: fyDetails.from, toDate: fyDetails.to, unit: '', status: 1, period: 'FY',
              displayPeriods: this.getDisplayPeriod(fyDetails.from, fyDetails.to), userIds: new Set<number>(),
            });
          }
          trainingGroupDataMap.get(key).userIds.add(trainee.id);
        }
      };

      categories = Array.isArray(categories) ? categories : [categories];
      categories.forEach(id => { const name = categoryMap.get(id); if (name) updateMap(id, name, false); });
      principles.forEach(id => { const name = principleMap.get(id); if (name) updateMap(id, name, true); });
    }

    
    return Array.from(trainingGroupDataMap.values()).map(g => {
      const { userIds, ...rest } = g;
      const final = { ...rest, value: String(userIds.size) };
      return { ...final };
    });
  }



  async buildReportingRows(
    item,
    answerData,
    reportingQuestions,
    financialYears,
    company,
  ) {
    const rows = [];
    const qId = Number(item.sub_question_id.match(/Q(\d+)/)?.[1] || 0);
    const reportingQuestion = reportingQuestions[`${qId}`];
    const relatedAnswers = answerData.filter(r => Number(r.questionId) === qId);

    for (const subItem of relatedAnswers) {
      if (subItem.notApplicable || typeof subItem.answer !== 'string') continue;

      let parsedAnswer;
      try {
        parsedAnswer = JSON.parse(subItem.answer);
      } catch {
        continue;
      }

      let value: any = 0;
      let unit = '';
      const match = item.sub_question_id.match(/R(\d+)C(\d+)/);

      // --- 3. GRID BASED LOGIC (Water, Waste, etc.) ---
      if (match) {
        const row = parseInt(match[1], 10);
        const col = parseInt(match[2], 10);
        value = parsedAnswer[row - 1]?.[col - 1] ?? 0;

        if (item.module === 'Waste') {
          unit = 'mT';
        }
        else if (item.module === 'Water') {
          unit = 'KL';
          value = value / 1000;

        }
        else if (['Diversity', 'Health & Safety', 'Training'].includes(item.module)) {
          unit = '';
        }
        else if (reportingQuestion?.frequency === 'CUSTOM') {
          unit = parsedAnswer[row - 1]?.[col] ?? '';
        }
        else {
          unit = '';
        }
      } else {
        value = parsedAnswer.readingValue ?? 0;
        unit = parsedAnswer.unit ?? (reportingQuestion?.details?.[0]?.option || '');
      }

      const financialYearValue = financialYears.find(fy => fy.id === subItem.financialYearId)?.financial_year_value ?? 'Not Found';

      // --- 1. SPECIAL CALCULATIONS (Emission & Energy Grids: Q451, Q452) ---
      if (qId === 452 || qId === 451) {
        const calculatedData = await this.getEmissionCalculation(parsedAnswer, qId);
        if (match) {
          const row = parseInt(match[1], 10);
          const col = parseInt(match[2], 10);

          if (item.category === 'Energy Consumption') {
            // Legacy logic: energy is index 0
            value = calculatedData[row - 1]?.[0] || 0;
            unit = 'GJ';
          } else if (item.category === 'Emission') {
        
            value = calculatedData[row - 1]?.[1] || 0;
            unit = 'tCo2';
          }
        }
      } else if (item.category === 'Energy Consumption' || item.category === 'Emission') {
        const fuel = this.fuelData.find((f) => f.questionId === qId);
        if (item.category === 'Energy Consumption') {
          value = this.calculateEnergy(subItem.answer, fuel);
          unit = 'GJ';
        } else {
          value = this.calculateEmissions(subItem.answer, fuel);
          unit = 'tCo2';
        }
      }

      if (reportingQuestion?.frequency === 'EVERY_FY') {
        const [startYear, endYear] = financialYearValue
          .split('-');

        const startMonth = company.starting_month;
        const endMonth = ((startMonth + 11) % 12) + 1;  // previous month mod 12

        const pad = num => String(num).padStart(2, '0');

        subItem.fromDate = `${startYear}-${pad(startMonth)}`;
        subItem.toDate = `${startYear}-${pad(endMonth)}`;
      }

      const period = this.getPeriodCode(subItem.fromDate, subItem.toDate, financialYearValue, company.starting_month);
      const displayPeriods = this.getDisplayPeriod(subItem.fromDate, subItem.toDate);

      const record = {
        questionId: qId,
        subQuestionId: item.sub_question_id,
        module: item.module,
        category: item.category,
        subCategory: item.sub_category || 'NA',
        kpi: item.kpi,
        fromDate: subItem.fromDate,
        toDate: subItem.toDate,
        period,
        displayPeriods,
        locationId: subItem.sourceId || 1,
        sublocationId: subItem.subLocationId || 0,
        financialYear: financialYearValue,
        value: String(Number(value).toFixed(2)),
        unit,
        status: 1,
      };

      rows.push(record);
    }
    return rows;
  }


  async updateGraphData(req: any) {
    try {
      const company = await this.userDaoService.getHeadOfficeCompanyDetails(true);
      const companyId = company.company_id;

      const [frameworkIds, trainingCategories, financialYears] = await Promise.all([
        this.superAdminClientService.getFrameworkIds(companyId),   
        this.superAdminClientService.getTrainingCategories(companyId),   
        this.superAdminClientService.getFinancialYears(companyId),
      ]);
  
      const [reportingQuestions, mainData] = await Promise.all([
        this.superAdminClientService.getReportingQuestions(companyId, frameworkIds),
        this.superAdminClientService.getGraphMappingData(companyId, frameworkIds),
      ]);

      const questionMap = reportingQuestions.reduce((a, q) => (a[q.questionId] = q, a), {});
      // const mainData = graphMappingRes.data;
      const questionIds = mainData.map(m => Number(m.question_id));

      const [answerData, trainingRecords, principles] = await Promise.all([
        this.sectorQuestionDaoModuleService.getReportingQuestionAnswer(questionIds),
        this.trainingDaoService.getAllRecordsForTraining(),
        this.trainingDaoService.getTrainingPrinciples(),
      ]);

      const rowsToUpsert = [];


      const trainingRows = await this.getTrainingAggregatedData(
        trainingCategories,
        trainingRecords,
        financialYears,
        principles,
        company.starting_month,
      );

      rowsToUpsert.push(...trainingRows);


      for (const item of mainData) {
        const rows = await this.buildReportingRows(item, answerData, questionMap, financialYears, company);
        rowsToUpsert.push(...rows);
      }

      // Execute Bulk Upsert
      await this.aiDashboardDaoService.bulkUpsertData(rowsToUpsert);

      return { isSuccess: true, message: 'Graph data updated successfully', data: null };

    } catch (err) {
      console.error('updateGraphData failed', err);
      throw err;
    }
  }



  async getPublishGraph(req: any) {
    try {
      const systemUserId = req.headers.userid;
      const company = await this.userDaoService.getHeadOfficeCompanyDetails(true);
      const { category } = req.query;
      const where: any = { status: 1 };
      if (category) {
        where.category = category;
      }
      const publishedGraphs = await this.aiDashboardDaoService.getPublishData(where);

      const userOrgChart = await this.findUserOrgChartData(systemUserId);
      if (!userOrgChart) {
        throw new HttpException({ status: 200, message: 'No Data Found', data: { teamWorkloadResults: [] } }, HttpStatus.OK);
      }
      const userIds = await this.extractUserIds(userOrgChart);

      const assignedQuestions: number[] = await this.sectorQuestionDaoModuleService.getAllQuestionId(
        userIds,
      );

      const allData = company.head_office ? await this.aiDashboardDaoService.getAllDashboardData() : await this.aiDashboardDaoService.getAllDashboardDataBasedOnIds(assignedQuestions);

      if (!allData || allData.length === 0) {
        return {
          success: true,
          data: [],
        };
      }

      const processedGraphs = await Promise.all(
        publishedGraphs.map(async (graph) => {
          const companyPlateform = process.env.PLATEFORM_NAME;
          let body = { script: graph.script, companyId: companyPlateform };
          const responseData = await this.externalApiCallService.postReq({}, body, process.env.SCRIPT_RUNNER_SERVICE_API_URL + 'runScript');
          const output = responseData.result;

          return {
            ...graph,
            output,
          };
        })
      );

      return {
        success: true,
        data: processedGraphs,
      };
    } catch (error) {
      console.error('Error fetching published graphs:', error);
      throw error;
    }
  }

  async refreshGraph(req: any) {
    try {
      const { graphId } = req.body;
      const systemUserId = req.headers.userid;
      const company = await this.userDaoService.getHeadOfficeCompanyDetails(true);
      if (!graphId) {
        return {
          success: false,
          message: 'Graph ID is required to delete a chart',
        };
      }
      const where: any = { status: 1 };
      if (graphId) {
        where.id = graphId;
      }
      const graph = await this.aiDashboardDaoService.getRefreshData(where);
      const userOrgChart = await this.findUserOrgChartData(systemUserId);
      if (!userOrgChart) {
        throw new HttpException({ status: 200, message: 'No Data Found', data: { teamWorkloadResults: [] } }, HttpStatus.OK);
      }
      const userIds = await this.extractUserIds(userOrgChart);

      const assignedQuestions: number[] = await this.sectorQuestionDaoModuleService.getAllQuestionId(
        userIds,
      );

      const allData = company.head_office ? await this.aiDashboardDaoService.getAllDashboardData() : await this.aiDashboardDaoService.getAllDashboardDataBasedOnIds(assignedQuestions);

      if (!allData || allData.length === 0) {
        throw new Error('No data available from dashboard service');

      }
      const companyPlateform = process.env.PLATEFORM_NAME;
      let body = { script: graph.script, companyId: companyPlateform };
      const responseData = await this.externalApiCallService.postReq({}, body, process.env.SCRIPT_RUNNER_SERVICE_API_URL + 'runScript');
      const output = responseData.result;

      await this.aiDashboardDaoService.updateOutputData(graphId, typeof output === "object" ? JSON.stringify(output) : output);
      return {
        success: true,
        data: output,
        message: 'Graph Refresh successfully',
      };
    } catch (error) {
      console.error('Error fetching published graphs:', error);
      throw error;
    }
  }

  async feedback(req: any) {
    try {
      const { graphId, feedback } = req.body;

      if (!graphId) {
        return {
          success: false,
          message: 'Graph ID is required to delete a chart',
        };
      }
      const where: any = { status: 1 };
      if (graphId) {
        where.id = graphId;
      }

      await this.aiDashboardDaoService.updateFeedBackData(graphId, feedback);
      return {
        success: true,
        message: 'Graph Feedback successfully Saved',
      };
    } catch (error) {
      console.error('Error fetching published graphs:', error);
      throw error;
    }
  }

  private async getEmissionCalculation(value: any, questionId: number) {

    if (Number(questionId) === 452) {
      const tmpData = value.map(([value, unit], index) => {
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

          if (normalizedUnit === 'liters' || normalizedUnit === 'liter') {
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
              1_000_000; // tCO2
          }
        }

        // ---- LPG (index 5 only) ----
        else if (index === 5) {
          let massKg = 0;

          if (normalizedUnit === 'cubic meters (m³)' || normalizedUnit === 'm³') {
            massKg = numericValue * 2.01; // m³ → kg
          } else if (normalizedUnit === 'kilograms (kg)' || normalizedUnit === 'kg' || normalizedUnit === 'liter' || normalizedUnit === 'liters') {
            massKg = numericValue* 0.54;
          } else if (normalizedUnit === 'metric tons') {
            massKg = numericValue * 1000;
          }

          if (massKg > 0) {
            energy = (massKg * 46.1) / 1000; // MJ/kg → GJ
            emissions =
              (energy * 63100 +
                energy * 5 * 27.9 +
                energy * 273 * 0.1) /
              1_000_000; // tCO2
          }
        }

        return [
          energy.toFixed(2), // Energy in GJ
          emissions.toFixed(2), // Emission in tCO2
        ];
      });

      return tmpData;

    }

    if (Number(questionId) === 451) {

      const tmpData = value.map(([value, unit], index) => {
        let energy = 0; // in GJ
        let emissions = 0; // in tCO2

        // Convert input to numeric
        const numericValue = parseFloat(value);

        if (isNaN(numericValue) || numericValue === 0 || !unit) {
          // Skip invalid or zero values
          return [0.0, 0.0];
        }

       if (unit.toLowerCase() === 'kwh') {
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
      return tmpData;
    }

  }

  private calculateEnergy(dataArray: any, fuel: any) {
    let answer = dataArray;
    if (typeof answer === "string") {
      try {
        answer = JSON.parse(answer);
      } catch (error) {
        return 0
      }
    }
    if (answer && answer.readingValue) {
      const readingValue = parseFloat(answer.readingValue);
      const emission = (readingValue * fuel.density * fuel.calorificValue) / 1000;
      return emission
    }
  }

  private calculateEmissions(dataArray: any, fuel: any) {
    let answer = dataArray;
    if (typeof answer === "string") {
      try {
        answer = JSON.parse(answer);
      } catch (error) {
        return 0
      }
    }
    if (answer && answer.readingValue) {
      const readingValue = parseFloat(answer.readingValue);
      const emission = (readingValue * fuel.emissionFactor) / 1000
      return emission
    }
  }



  async deletePublishGraph(req: any) {
    try {
      const { graphId } = req.body;

      if (!graphId) {
        return {
          success: false,
          message: 'Graph ID is required to delete a chart',
        };
      }

      const result = await this.aiDashboardDaoService.deletePublishData(graphId);

      if (result.affected && result.affected > 0) {
        return {
          success: true,
          message: 'Chart data marked as deleted successfully',
        };
      } else {
        return {
          success: false,
          message: 'No active chart found with the given ID',
        };
      }
    } catch (error) {
      console.error('Error marking published graph as deleted:', error);
      throw error;
    }
  }

  async savePublishGraph(body: CreatePublishGraphDto, req: any) {
    try {
      const systemUserId = Number(req.headers['userid']);
      if (!systemUserId) {
        throw new Error('Missing or invalid userId in headers');
      }
      const { graphId, query, script, category } = body;
      const data = {
        userId: systemUserId,
        graphId,
        query,
        script,
        category,
      };
      await this.aiDashboardDaoService.savePublishData(data);
      return {
        isSuccess: true,
        message: 'Chart data Saved successfully',
      };
    } catch (error) {
      console.error('Error saving publish graph:', error);
      throw error;
    }
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

 
  

  private deduceType(fromDateStr: string, toDateStr: string): number {
    const fromDate = new Date(fromDateStr);
    const toDate = new Date(toDateStr);
    const fromYear = fromDate.getFullYear();
    const fromMonth = fromDate.getMonth();
    const toYear = toDate.getFullYear();
    const toMonth = toDate.getMonth();
    return (toYear - fromYear) * 12 + (toMonth - fromMonth);
  }

  private getPeriodCode(
    fromDateStr: string,
    toDateStr: string,
    financialYear: string,
    startingMonth: number,
  ): string {
    const type = this.deduceType(fromDateStr, toDateStr);
    const [fyStartYearStr] = financialYear.split('-');
    const fyStartYear = parseInt(fyStartYearStr, 10);
    const [fromYearStr, fromMonthStr] = fromDateStr.split('-');
    const fromYear = parseInt(fromYearStr, 10);
    const fromMonth = parseInt(fromMonthStr, 10);

    let monthOffset = (fromYear - fyStartYear) * 12 + (fromMonth - startingMonth);
    if (monthOffset < 0) monthOffset += 12;

    if (type === 1) return `M${(monthOffset % 12) + 1}`;
    if (type === 3) return `Q${Math.floor(monthOffset / 3) + 1}`;
    if (type === 6) return `H${Math.floor(monthOffset / 6) + 1}`;
    if (type === 12) return 'FY';

    return '';
  }

  private getDisplayPeriod(fromDateStr: string, toDateStr: string): string {
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];

    const fromDate = new Date(fromDateStr);
    const toDate = new Date(toDateStr);
    const fromMonth = fromDate.getMonth();

    let endMonthIndex: number;
    if (toDate.getDate() === 1) {
      endMonthIndex = (toDate.getMonth() - 1 + 12) % 12;
    } else {
      endMonthIndex = toDate.getMonth();
    }

    if (this.deduceType(fromDateStr, toDateStr) === 12) {
      return 'Apr–Mar';
    }

    if (fromMonth === endMonthIndex) {
      return `${monthNames[fromMonth]}`;
    } else {
      return `${monthNames[fromMonth]}–${monthNames[endMonthIndex]}`;
    }
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

  private extractUniqueValues(data: any) {
    return {
      modules: [...new Set(data.map(d => d.module))],
      categories: [...new Set(data.map(d => d.category))],
      subCategories: [...new Set(data.map(d => d.subCategory))],
      kpis: [...new Set(data.map(d => d.kpi))],
      locations: [...new Set(data.map(d => d.location))],
      periods: [...new Set(data.map(d => d.period))],
      displayPeriods: [...new Set(data.map(d => d.displayPeriods))],
      financialYears: [...new Set(data.map(d => d.financialYear))],
      units: [...new Set(data.map(d => d.unit))],
    };
  }
}