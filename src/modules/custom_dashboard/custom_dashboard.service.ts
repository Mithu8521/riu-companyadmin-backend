import { Injectable, NotFoundException, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { CustomDashboardDaoService } from '../dao/custom-dashboard-dao/custom-dashboard-dao.service';
import { UserDaoService } from '../dao/setting/user-dao/user-dao.service';
import { ExternalApiCallService } from '@app/utils/common/external-api-call/external-api-call.service';
import { AnswerFrequencyDaoService } from '../dao/setting/answer-frequency-dao/answer-frequency-dao.service';
import { SourceDaoService } from '../dao/setting/source-dao/source-dao.service';
import { SuperAdminClientService } from '../super-admin-client/super-admin-client.service';
import { DataSourceType } from './enums/data-source-type.enum';
import { IotMetersDaoService } from '../dao/iot-meters-dao/iot-meters-dao.service';
import { Lambda } from 'aws-sdk';


interface FinancialYear {
  id: number;
  financial_year_value: string;
  start_month?: number;
}

interface PeriodOption {
  label: string;
  value: string | number;
}
@Injectable()

export class CustomGraphService {
  private readonly months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  constructor(
    private biDashboardDao: CustomDashboardDaoService,
    private iotMetersDaoService: IotMetersDaoService,
    private userDaoService: UserDaoService, 
    private externalApiCallService: ExternalApiCallService, 
    private answerFrequencyDaoService: AnswerFrequencyDaoService, 
    private sourceDaoService: SourceDaoService,
    private superAdminClientService: SuperAdminClientService
  ) { }

  async getAllDataSources(req: any) {
    const userId = req.headers.userid;
    return this.biDashboardDao.getAllDataSources();
  }

  async create(req: any, data: any) {
    const userId = req.headers.userid;
    try {
      if (!data.widgetConfig || !data.widgetConfig.module || data.widgetConfig.module.length === 0) {
        throw new BadRequestException('Widget config with at least one module is required');
      }

      if (!data.title || data.title.trim() === '') {
        throw new BadRequestException('Title is required');
      }

      if (!data.chartType) {
        throw new BadRequestException('Chart type is required');
      }

      if (!data.widgetConfig.filters) {
        throw new BadRequestException('Widget config filters are required');
      }

      if (!data.widgetConfig.group_by || data.widgetConfig.group_by.length === 0) {
        throw new BadRequestException('Group by configuration is required');
      }

      if (!data.widgetConfig.aggregate) {
        throw new BadRequestException('Aggregate configuration is required');
      }

      const maxOrder = await this.biDashboardDao.getMaxDisplayOrder(userId, data.dashboardId);

      const xAxisField = data.xAxisField || 'displayPeriods';
      const stackByField = data.stackByField || null;

      const graphData = {
        userId,
        dataSourceType: data?.dataSourceType ?? 'REPORTING',
        title: data.title.trim(),
        description: data.description ? data.description.trim() : null,
        category: data.widgetConfig.module[0] === 'Health & Safety' ? 'HealthSafety' :data.widgetConfig.module[0],
        widgetConfig: {
          module: data.widgetConfig.module,
          filters: {
            financial_year: data.widgetConfig.filters.financial_year || [],
            location_id: data.widgetConfig.filters.location_id || [],
            sublocation_id: data.widgetConfig.filters.sublocation_id || [],
            category: data.widgetConfig.filters.category || [],
            sub_category: data.widgetConfig.filters.sub_category || [],
            kpi: data.widgetConfig.filters.kpi || [],
            displayPeriods: data.widgetConfig.filters?.displayPeriods || [],
            meterId: data.widgetConfig.filters?.meterId || [],
            startDateTime: data.widgetConfig?.filters?.startDateTime || '',
            endDateTime: data.widgetConfig?.filters?.endDateTime || '',
            aggregationPeriodValue: data.widgetConfig?.filters?.aggregationPeriodValue || 1,
            aggregationPeriodUnit: data.widgetConfig?.filters?.aggregationPeriodUnit || 'hours'
          },
          group_by: data.widgetConfig.group_by,
          aggregate: data.widgetConfig.aggregate,
          sort: data.widgetConfig.sort || {
            field: xAxisField,
            order: 'asc'
          },
          aggregateSubLocations: data.widgetConfig?.aggregateSubLocations,
        },
        chartType: data.chartType,
        xAxisField: xAxisField,
        stackByField: stackByField,
        displayOrder: data.displayOrder || maxOrder + 1,
        dashboardId: data.dashboardId,
        refreshInterval: data.refreshInterval || null,
        isActive: 1,
        lastSyncedAt: new Date(),
      };

      const saved = await this.biDashboardDao.saveGraph(graphData);
      return {
        isSuccess: true,
        message: 'Graph created successfully',
        data: {
          ...saved,
          xAxisField: xAxisField,
          stackByField: stackByField,
        },
      };
    } catch (error: any) {
      console.error('Error creating graph:', error);
      return {
        isSuccess: false,
        message: error.message || 'Failed to create graph',
        data: null,
      };
    }
  }

  private getKpiFilterOptionsForReporting = async () => {

    const graphMap = await this.biDashboardDao.getAllDashboardData()
    const mainData = graphMap || [];
    const graphFilters: Record<string, any> = {};
    for (const item of mainData) {
      const { module, category, subCategory, kpi } = item;

      if (!graphFilters[module]) graphFilters[module] = {};
      if (!graphFilters[module][category]) graphFilters[module][category] = {};
      if (!graphFilters[module][category][subCategory])
        graphFilters[module][category][subCategory] = [];

      if (!graphFilters[module][category][subCategory].includes(kpi)) {
        graphFilters[module][category][subCategory].push(kpi);
      }
    }

    return graphFilters;
  }

  private getKpiFilterOptionsForIotMeters = async () => {

    const graphMap = await this.iotMetersDaoService.getAllDashboardFilters();
    const mainData = graphMap || [];
    const graphFilters: Record<string, any> = {};
    for (const item of mainData) {
      const { module, category, subCategory, kpi, meterId } = item;

      if (!graphFilters[module]) graphFilters[module] = {};
      if (!graphFilters[module][category]) graphFilters[module][category] = {};
      if (!graphFilters[module][category][subCategory])
        graphFilters[module][category][subCategory] = {};
      if (!graphFilters[module][category][subCategory][kpi])
        graphFilters[module][category][subCategory][kpi] = [];

      if (!graphFilters[module][category][subCategory][kpi].includes(meterId)) {
        graphFilters[module][category][subCategory][kpi].push(meterId);
      }
    }

    return graphFilters;
  }

  async getFilterOptions(req: any) {
    try {
      const company = await this.userDaoService.getHeadOfficeCompanyDetails(true);
      const companyId = company.company_id;
      const { dataSource } = req.query;
       
      const graphFilters: Record<string, any> = {};
      let kpiFilters: Record<string, any>;
      if (dataSource === DataSourceType.IOT_METERS) {
        kpiFilters = await this.getKpiFilterOptionsForIotMeters();
      } else {
        kpiFilters = await this.getKpiFilterOptionsForReporting();
      }

      Object.assign(graphFilters, kpiFilters);

      const { data: financialYears }: { data: FinancialYear[] } =
        await this.externalApiCallService.getReq(
          `${process.env.COMPANY_SERVER_API_URL}getFinancialYear`,
          { userId: companyId, type: 'COMPANY' },
          {},
        );

      if (financialYears?.length) {
        graphFilters['Financial Years'] = {};
        if (dataSource === DataSourceType.IOT_METERS)
          graphFilters['Financial Years'] = [];

        for (const fy of financialYears) {
          const financialYearId = fy.id;
          const financialYearLabel = fy.financial_year_value;

          if (dataSource === DataSourceType.IOT_METERS) {
            graphFilters['Financial Years'].push({value: financialYearLabel, label: financialYearLabel})
          } else {
            const startMonth = company.starting_month ?? 4;

            const modules = await this.answerFrequencyDaoService.getAnswerFrequency(financialYearId);
            const frequency = modules && modules.length ? modules[0].frequency : 'YEARLY';

            const periods = this.generatePeriodOptions(frequency, startMonth);

            graphFilters['Financial Years'][financialYearLabel] = periods;
          }
        }
      }

      const locations = await this.sourceDaoService.getAllLocationWithSubLocation();
      if (locations?.length) {
        graphFilters['Location'] = this.buildLocationOptions(locations);
      }

      return {
        success: true,
        data: graphFilters,
      };
    } catch (error) {
      console.error('Error in getFilterOptions:', error);
      throw error;
    }
  }

  private buildLocationOptions(locations) {
    const options = [];
    for (const locationObj of locations) {
      const location = locationObj?.location;
      const baseLabel = locationObj.unitCode || `${location.area}, ${location.city}`;

      // Always add main location
      const locationOption = {
        value: locationObj.id,
        label: baseLabel,
        subLocations: []
      };

      // Add sublocations
      for (const subLocation of locationObj.subLocations) {
        const subLabel = `${baseLabel} (${subLocation.name})`;

        locationOption.subLocations.push({
          value: subLocation.id,
          label: subLabel,
        });
      }

      options.push(locationOption);
    }

    return options;
  }

  private generatePeriodOptions(frequency: string, start: number): PeriodOption[] {
    const months = this.months;
    const options: PeriodOption[] = [];

    if (frequency === 'MONTHLY') {
      const orderedMonths =
        start === 1
          ? months
          : [...months.slice(start - 1), ...months.slice(0, start - 1)];

      for (let i = 0; i < 12; i++) {
        const month = orderedMonths[i];
        const value = ((start + i - 1) % 12) + 1;
        options.push({ label: month, value: month });
      }
    } else if (frequency === 'QUARTERLY') {
      for (let i = start - 1; i < start + 12; i += 3) {
        const quarterStartIndex = i % 12;
        const quarterEndIndex = (i + 3) % 12;
        const label = `${months[quarterStartIndex]}–${months[(quarterEndIndex - 1 + 12) % 12]
          }`;
        options.push({ label, value: label });
      }
    } else if (frequency === 'HALF_YEARLY') {
      for (let i = 0; i < 2; i++) {
        const halfStartIndex = (start - 1 + i * 6) % 12;
        const halfEndIndex = (start - 1 + i * 6 + 5) % 12;
        const half = `${months[halfStartIndex]}–${months[halfEndIndex]}`;
        options.push({ label: half, value: half });
      }
    } else if (frequency === 'YEARLY') {
      const yearlyStartIndex = start - 1;
      const label = `${months[yearlyStartIndex]}–${months[(yearlyStartIndex - 1 + 12) % 12]
        }`;
      options.push({ label, value: label });
    }

    return options;
  }

  async getGraphDataWithFilters(id: number, userId: number, filters: any) {
    try {
      const graph = await this.biDashboardDao.getGraphById(id, userId);

      if (!graph) {
        throw new NotFoundException('Graph not found');
      }

      // Merge filters with widget config
      const updatedConfig = {
        ...graph.widgetConfig,
        filters: {
          ...graph.widgetConfig.filters,
          ...filters,
        },
      };

      // Process widget config with new filters
      const result = await this.biDashboardDao.processWidget(graph.xAxisField, graph.stackByField, updatedConfig);

      return {
        isSuccess: true,
        message: 'Graph data fetched successfully',
        data: result,
      };
    } catch (error: any) {
      return {
        isSuccess: false,
        message: error.message || 'Failed to fetch graph data',
        data: null,
      };
    }
  }

  async findAll(req: any, dashboardId?: number) {
    try {
      const userId = req.headers.userid;
      const category = req.query.category;
      const graphs = await this.biDashboardDao.getAllGraphs(userId, category, dashboardId);

      return {
        isSuccess: true,
        message: 'Graphs fetched successfully',
        data: graphs,
      };
    } catch (error: any) {
      return {
        isSuccess: false,
        message: error.message || 'Failed to fetch graphs',
        data: null,
      };
    }
  }

  async findOne(id: number, req: any) {
    try {
      const userId = req.headers.userid;

      const graph = await this.biDashboardDao.getGraphById(id, userId);

      if (!graph) {
        throw new NotFoundException('Graph not found');
      }

      return {
        isSuccess: true,
        message: 'Graph fetched successfully',
        data: graph,
      };
    } catch (error: any) {
      return {
        isSuccess: false,
        message: error.message || 'Failed to fetch graph',
        data: null,
      };
    }
  }

  async sortByDisplayPeriods(data, startMonthIndex = 3) {
    if (!Array.isArray(data)) return data;

    // ✅ If no "displayPeriods" field present → do nothing
    const hasDisplayPeriods = data.some(d => d.displayPeriods);
    if (!hasDisplayPeriods) return data;

    // Extract unique displayPeriods (ignore null/undefined)
    const uniquePeriods = [...new Set(data.map(d => d.displayPeriods).filter(Boolean))];

    // Month order (Jan = 0 → Dec = 11)
    const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const getMonthIndex = (period) => {
      const match = period?.match(/[A-Za-z]{3}/); // e.g. "Apr–Jun" → "Apr"
      return match ? monthOrder.indexOf(match[0]) : -1;
    };

    // Sort all periods naturally by first month
    const sortedPeriods = uniquePeriods.sort((a, b) => getMonthIndex(a) - getMonthIndex(b));

    // Find the period whose first month matches the given startMonthIndex
    const startPeriodIndex = sortedPeriods.findIndex(p => {
      const idx = getMonthIndex(p);
      return idx === startMonthIndex;
    });

    // Rotate so it starts from that period
    const periodOrder =
      startPeriodIndex === -1
        ? sortedPeriods
        : [...sortedPeriods.slice(startPeriodIndex), ...sortedPeriods.slice(0, startPeriodIndex)];

    // Sort data based on this order
    return [...data].sort((a, b) => {
      const indexA = periodOrder.indexOf(a.displayPeriods);
      const indexB = periodOrder.indexOf(b.displayPeriods);

      if (indexA === -1 && indexB === -1) return 0;
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  };


  async getGraphData(id: number, req: any) {
    try {
      const company = await this.userDaoService.getHeadOfficeCompanyDetails(true);
      const userId = req.headers.userid;
      const graph = await this.biDashboardDao.getGraphById(id, userId);

      if (!graph) {
        throw new NotFoundException('Graph not found');
      }

      let result;
      if (graph.dataSourceType === DataSourceType.IOT_METERS) {
        result = await this.iotMetersDaoService.processWidget(graph.xAxisField, graph.stackByField, graph.widgetConfig);
      } else {
        result = await this.biDashboardDao.processWidget(graph.xAxisField, graph.stackByField, graph.widgetConfig);
      }

      let normalizedResult = await this.normalizeResultsByLocation(graph, result.data);
      if (graph.dataSourceType !== DataSourceType.IOT_METERS) {
        normalizedResult = await this.normalizeResultsByPeriod(company, graph, normalizedResult);
      }
      this.validateUnits(graph, normalizedResult);

      if (graph.dataSourceType !== DataSourceType.IOT_METERS) {
        normalizedResult = await this.sortByDisplayPeriods(normalizedResult, Number(company.starting_month) - 1);
      }
      result.data = normalizedResult;
      result.metadata.total = normalizedResult.length;
      result.metadata.dataSourceType = graph.dataSourceType;
      if (graph.stackByField) {
        result.metadata['isGroupedStacked'] = true;
      }

      await this.biDashboardDao.updateLastSync(id);

      return {
        isSuccess: true,
        message: 'Graph data fetched successfully',
        data: result
      };
    } catch (error: any) {
      if (!(error instanceof HttpException)) {
        throw new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      throw error;
    }
  }

  private async validateUnits(graph, result) {
    const normalizedResults = {}
    for(const row of result) {
      const xAxis = row[graph.xAxisField];
      const sbf = row?.[graph?.stackByField];
      const key = sbf ? `${xAxis}-${sbf}` : `${xAxis}`;
      if (!normalizedResults[key]) {
        normalizedResults[key] = {
          ...row,
          unit: row?.unit ?? ''
        }
      } else {
        // TODO: Only aggreagate_by sum is supported.
        if (normalizedResults[key]['unit'] !== (row?.unit ?? '')) {
          throw new HttpException("Mismatched units, please correct your config", HttpStatus.BAD_REQUEST);
        }
      }
    }
  }

  private async normalizeResultsByPeriod(companyDetails: any, graph: any, result: any) {
    if (graph.xAxisField === 'displayPeriods' || graph?.stackByField === 'displayPeriods') {
      try {
        const financialYears = await this.superAdminClientService.getFinancialYears(companyDetails.company_id);
        
        const periodsByFY: Record<string, any> = {};
        const frequencyByFY: Record<string, string> = {};

        for (const financialYearValue of graph.widgetConfig.filters['financial_year']) {

          const financialYearId = financialYears.find(fy => fy.financial_year_value === financialYearValue)?.id;

          if (!financialYearId) {
            console.warn(`Financial year ${financialYearValue} not found`);
            continue;
          }

          const startMonth = companyDetails.starting_month ?? 4;
          const modules = await this.answerFrequencyDaoService.getAnswerFrequency(financialYearId);
          const frequency = modules?.length ? modules[0].frequency : 'YEARLY';
          const periods = this.generatePeriodOptions(frequency, startMonth);

          const uniquePeriods = Array.from(
            new Set(periods.map((p) => JSON.stringify(p)))
          ).map((p) => JSON.parse(p));

          periodsByFY[financialYearId] = uniquePeriods;
          frequencyByFY[financialYearId] = frequency;
        }

        const minLength = Math.min(
          ...Object.values(periodsByFY).map((arr) => arr.length)
        );

        const yearWithMinPeriods = Object.entries(periodsByFY).find(
          ([_, periods]) => periods.length === minLength
        )?.[0];

        const targetPeriods = periodsByFY[yearWithMinPeriods];

        const allSourcePeriods = Array.from(new Set(Object.values(periodsByFY).flat().map((p) => JSON.stringify(p)))).map((p) => JSON.parse(p));
        const periodMapping = this.buildSourceToTargetMapping(targetPeriods, allSourcePeriods);

        // Check if data has a stack field (could be kpi, category, location, etc.)
        const stackByField = graph.stackByField;
        
        const normalizedResults = {}
        for(const row of result) {
          const dp = periodMapping[row['displayPeriods']];
          const sbf = row?.[stackByField];
          const key = sbf ? `${dp}-${sbf}` : `${dp}`;
          if (!normalizedResults[key]) {
            normalizedResults[key] = {
              ...row,
              displayPeriods: dp,
              sum_value: row.sum_value,
              unit: row.unit
            }

            if (sbf) {
              normalizedResults[key][stackByField] = sbf;
            }
          } else {
            // TODO: Only aggreagate_by sum is supported.
            if (normalizedResults[key]['unit'] !== row.unit) {
              throw new HttpException("Mismatched units, please correct your config", HttpStatus.BAD_REQUEST);
            }
            normalizedResults[key]['sum_value'] += row.sum_value;
          }
        }
        
        return Object.values(normalizedResults);

      } catch (error) {
        if (!(error instanceof HttpException)) {
          throw new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR);
        }

        throw error;
      }
    }

    return result;
  }

  private async normalizeResultsByLocation(graph: any, result: any) {
    if (graph.xAxisField !== 'location_id' && graph.stackByField !== 'location_id') {
      return result;
    }

    const locations = await this.sourceDaoService.getAllLocationWithSubLocation();
    const locationOptions = this.buildLocationOptions(locations);
    const locationsById = locationOptions.reduce((acc, loc) => {
      acc[`${loc.value}`] = loc;
      return acc;
    }, {});

    for (const row of result) {
      const locationObj = locationsById[`${row.location_id}`];
      if (!locationObj) {
        throw new HttpException('Location not found', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      if (row?.sublocation_id && graph.widgetConfig?.aggregateSubLocations === false) {
        const subLocationObj = locationObj.subLocations.find(subLoc => subLoc.value == row.sublocation_id);
        if (!subLocationObj) {
          throw new HttpException('Sub Location not found', HttpStatus.INTERNAL_SERVER_ERROR);
        }

        // replace location_id with unit_code or location name.
        row.location_id = subLocationObj.label;
      } else {
        row.location_id = locationObj.label;
      }
    }

    return result;
  }

  private buildSourceToTargetMapping(targetPeriods: any[], allPeriods: any[]): Record<string, string> {
    const mapping: Record<string, string> = {};
    const monthOrder = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

    // Precompute target ranges for quick lookup
    const targetRanges = targetPeriods.map((t) => {
      if (t.label.includes('–')) {
        const [tStart, tEnd] = t.label.split('–').map((m: string) => m.trim());
        return {
          value: t.value,
          startIdx: monthOrder.indexOf(tStart),
          endIdx: monthOrder.indexOf(tEnd),
        };
      } else {
        const idx = monthOrder.indexOf(t.label);
        return {
          value: t.value,
          startIdx: idx,
          endIdx: idx,
        };
      }
    });

    for (const source of allPeriods) {
      let sStartIdx: number;
      let sEndIdx: number;

      if (source.label.includes('–')) {
        const [sStart, sEnd] = source.label.split('–').map((m: string) => m.trim());
        sStartIdx = monthOrder.indexOf(sStart);
        sEndIdx = monthOrder.indexOf(sEnd);
      } else {
        const idx = monthOrder.indexOf(source.label);
        sStartIdx = idx;
        sEndIdx = idx;
      }

      // Find the target this source belongs to
      for (const target of targetRanges) {
        if (sStartIdx >= target.startIdx && sEndIdx <= target.endIdx) {
          mapping[source.value] = target.value; // source → target
          break;
        }
      }
    }

    return mapping;
  }

  async refreshGraph(id: number, req: any) {
    try {
      return await this.getGraphData(id, req);
    } catch (error: any) {
      return {
        isSuccess: false,
        message: error.message || 'Failed to refresh graph',
        data: null,
      };
    }
  }

  async update(id: number, req: any, data: any) {
    try {
      const userId = req.headers.userid;
      const graph = await this.biDashboardDao.getGraphById(id, userId);

      if (!graph) {
        throw new NotFoundException('Graph not found');
      }

      // Validate required fields if provided
      if (data.title !== undefined && (!data.title || data.title.trim() === '')) {
        throw new BadRequestException('Title cannot be empty');
      }

      if (data.widgetConfig && !data.widgetConfig.module || (data.widgetConfig.module && data.widgetConfig.module.length === 0)) {
        throw new BadRequestException('Widget config with at least one module is required');
      }

      if (data.chartType !== undefined && !data.chartType) {
        throw new BadRequestException('Chart type is required');
      }

      if (data.widgetConfig && !data.widgetConfig.filters) {
        throw new BadRequestException('Widget config filters are required');
      }

      if (data.widgetConfig && (!data.widgetConfig.group_by || data.widgetConfig.group_by.length === 0)) {
        throw new BadRequestException('Group by configuration is required');
      }

      if (data.widgetConfig && !data.widgetConfig.aggregate) {
        throw new BadRequestException('Aggregate configuration is required');
      }

      // Prepare update data
      const updateData: any = { updatedAt: new Date() };

      if (data.title) {
        updateData.title = data.title.trim();
      }

      if (data.description !== undefined) {
        updateData.description = data.description ? data.description.trim() : null;
      }

      // Handle widgetConfig with proper structure
      if (data.widgetConfig) {
        updateData.widgetConfig = {
          module: data.widgetConfig.module,
          filters: {
            financial_year: data.widgetConfig.filters?.financial_year || [],
            location_id: data.widgetConfig.filters?.location_id || [],
            sublocation_id: data.widgetConfig.filters?.sublocation_id || [],
            category: data.widgetConfig.filters?.category || [],
            sub_category: data.widgetConfig.filters?.sub_category || [],
            kpi: data.widgetConfig.filters?.kpi || [],
            displayPeriods: data.widgetConfig.filters?.displayPeriods || [],
          },
          group_by: data.widgetConfig.group_by,
          aggregate: data.widgetConfig.aggregate,
          sort: data.widgetConfig.sort || graph.widgetConfig?.sort || {
            field: data.xAxisField || 'displayPeriods',
            order: 'asc'
          },
          aggregateSubLocations: data.widgetConfig?.aggregateSubLocations,
        };
      }

      if (data.chartType) {
        updateData.chartType = data.widgetConfig.module;
      }


      if (data.chartType) {
        updateData.chartType = data.chartType;
      }

      if (data.displayOrder !== undefined) {
        updateData.displayOrder = data.displayOrder;
      }

      if (data.refreshInterval !== undefined) {
        updateData.refreshInterval = data.refreshInterval;
      }

      if (data.xAxisField) {
        updateData.xAxisField = data.xAxisField;
      }

      if (data.stackByField !== undefined) {
        updateData.stackByField = data.stackByField;
      }

      // Update lastSyncedAt when critical fields change
      if (data.widgetConfig || data.chartType) {
        updateData.lastSyncedAt = new Date();
      }

      const updated = await this.biDashboardDao.updateGraph(id, userId, updateData);

      return {
        isSuccess: true,
        message: 'Graph updated successfully',
        data: updated,
      };
    } catch (error: any) {
      console.error('Error updating graph:', error);
      return {
        isSuccess: false,
        message: error.message || 'Failed to update graph',
        data: null,
      };
    }
  }

  async delete(id: number, req: any) {
    try {
      const userId = req.headers.userid;
      const graph = await this.biDashboardDao.getGraphById(id, userId);

      if (!graph) {
        throw new NotFoundException('Graph not found');
      }

      await this.biDashboardDao.deleteGraph(id, userId);

      return {
        isSuccess: true,
        message: 'Graph deleted successfully',
        data: null,
      };
    } catch (error: any) {
      return {
        isSuccess: false,
        message: error.message || 'Failed to delete graph',
        data: null,
      };
    }
  }

  async reorderGraphs(req: any, data: any) {
    try {
      const userId = req.headers.userid;
      const graphOrders = data.graphOrders;

      if (!Array.isArray(graphOrders)) {
        throw new BadRequestException('graphOrders must be an array');
      }

      await Promise.all(
        graphOrders.map(({ id, displayOrder }) =>
          this.biDashboardDao.updateDisplayOrder(id, userId, displayOrder),
        ),
      );

      return {
        isSuccess: true,
        message: 'Graphs reordered successfully',
        data: null,
      };
    } catch (error: any) {
      return {
        isSuccess: false,
        message: error.message || 'Failed to reorder graphs',
        data: null,
      };
    }
  }

  async publishGraph(id: number, req: any) {
    try {
      const userId = req.headers.userid;
      const graph = await this.biDashboardDao.getGraphById(id, userId);

      if (!graph) {
        throw new NotFoundException('Graph not found');
      }

      const publishData = {
        published: 1,
        publishDate: new Date(),
        updatedAt: new Date(),
      };

      const updated = await this.biDashboardDao.updateGraph(id, userId, publishData);

      return {
        isSuccess: true,
        message: 'Graph published successfully',
        data: updated,
      };
    } catch (error: any) {
      console.error('Error publishing graph:', error);
      return {
        isSuccess: false,
        message: error.message || 'Failed to publish graph',
        data: null,
      };
    }
  }
}