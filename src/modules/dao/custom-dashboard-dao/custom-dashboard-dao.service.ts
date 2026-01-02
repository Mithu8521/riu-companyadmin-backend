import { AiDashboardEntity } from '@app/modules/ai_dashboard/entities/ai_dashboard.entity';
import { DashboardDataSource } from '@app/modules/custom_dashboard/entities/dashboard-data-sources.entity';
import { PublishedCustomGraphEntity } from '@app/modules/custom_dashboard/entities/published_bi_graphs.entity';
import { LocationEntity } from '@app/modules/setting/source/entities/source.entity';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class CustomDashboardDaoService {
  constructor(private dataSource: DataSource) {}

  private getRepo(entity: any) {
    return this.dataSource.getRepository(entity);
  }

  async getAllDataSources() {
    const repo = this.getRepo(DashboardDataSource);
    const where: any = {isActive: 1};
    return await repo.find({where});
  }

  async saveGraph(data: Partial<PublishedCustomGraphEntity>) {
    const repo = this.getRepo(PublishedCustomGraphEntity);
    const newGraph = repo.create(data);
    return await repo.save(newGraph);
  }

  async getAllGraphs(userId: number, category:string, dashboardId?: number) {
    const repo = this.getRepo(PublishedCustomGraphEntity);
    const where: any = { userId,category, isActive: 1, published: 1 };
    
    if (dashboardId) {
      where.dashboardId = dashboardId;
    }

    return await repo.find({
      where,
      order: { displayOrder: 'ASC' },
    });
  }

  async getGraphById(id: number, userId: number) {
    const repo = this.getRepo(PublishedCustomGraphEntity);
    return await repo.findOne({
      where: { id, userId, isActive: 1 },
    });
  }

  async updateGraph(id: number, userId: number, data: Partial<PublishedCustomGraphEntity>) {
    const repo = this.getRepo(PublishedCustomGraphEntity);
    await repo.update({ id, userId }, data);
    return await this.getGraphById(id, userId);
  }

  async deleteGraph(id: number, userId: number) {
    const repo = this.getRepo(PublishedCustomGraphEntity);
    return await repo.update({ id, userId }, { isActive: 0 });
  }

  async getMaxDisplayOrder(userId: number, dashboardId?: number) {
    const repo = this.getRepo(PublishedCustomGraphEntity);
    const query = repo
      .createQueryBuilder('graph')
      .select('MAX(graph.displayOrder)', 'maxOrder')
      .where('graph.userId = :userId', { userId })
      .andWhere('graph.isActive = 1');

    if (dashboardId) {
      query.andWhere('graph.dashboardId = :dashboardId', { dashboardId });
    }

    const result = await query.getRawOne();
    return result?.maxOrder || 0;
  }

  async updateDisplayOrder(id: number, userId: number, displayOrder: number) {
    const repo = this.getRepo(PublishedCustomGraphEntity);
    return await repo.update({ id, userId }, { displayOrder });
  }

  async updateLastSync(id: number) {
    const repo = this.getRepo(PublishedCustomGraphEntity);
    return await repo.update({ id }, { lastSyncedAt: new Date() });
  }

  async getAllDashboardData(filters?: any) {
    const repo = this.getRepo(AiDashboardEntity);
    const where: any = { status: 1 };

    if (filters) {
      Object.assign(where, filters);
    }

    return await repo.find({ where });
  }

  async processWidget(xAxisField, stackByField, widgetConfig: any) {
    try {
      // Validate widget config
      if (!widgetConfig || !widgetConfig.module || widgetConfig.module.length === 0) {
        throw new Error('Module configuration is required');
      }

      if (!widgetConfig.group_by || widgetConfig.group_by.length === 0) {
        throw new Error('Group by configuration is required');
      }

      if (!widgetConfig.aggregate) {
        throw new Error('Aggregate configuration is required');
      }

      const processedData = await this.processWidgetQuery(xAxisField, stackByField, widgetConfig);

      return {
        data: processedData,
        metadata: {
          ...widgetConfig,
          total: processedData.length,
          xAxisField,
          stackByField
        },
      };
    } catch (error) {
      console.error('Error processing widget:', error);
      throw new Error(`Failed to process widget: ${error.message}`);
    }
  }

  async processWidgetQuery(xAxisField, stackByField, widgetConfig: any) {
    const { module, filters, group_by = [], aggregate, sort, limit, aggregateSubLocations } = widgetConfig;

    const qb = this.getRepo(AiDashboardEntity).createQueryBuilder('dashboard');
    qb.where('dashboard.status = 1');

    if (Array.isArray(module) && module.length > 0) {
      qb.andWhere('dashboard.module IN (:...modules)', { modules: module });
    }

    // --- Normalize filters ---
    const normalizedFilters: Record<string, any> = {};
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        const normalizedKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        normalizedFilters[normalizedKey] = value;
      });
    }

    Object.entries(normalizedFilters).forEach(([key, value]) => {
      if (!value || (Array.isArray(value) && value.length === 0)) return;

      const columnName = this.mapFieldToColumn(key);
      if (Array.isArray(value)) {
        qb.andWhere(`${columnName} IN (:...${key})`, { [key]: value });
      } else if (value === null) {
        qb.andWhere(`${columnName} IS NULL`);
      } else {
        qb.andWhere(`${columnName} = :${key}`, { [key]: value });
      }
    });

    // --- Select + Group By ---
    qb.select('dashboard.unit', 'unit');

    if (aggregateSubLocations === false && (xAxisField === 'location_id' || stackByField === 'location_id')) {
      const columnName = this.mapFieldToColumn('sublocation_id');
      qb.addSelect(columnName, 'sublocation_id');
      qb.addGroupBy(columnName);
    }

    if (group_by.length > 0) {
      group_by.forEach((field) => {
        const columnName = this.mapFieldToColumn(field);
        qb.addSelect(columnName, field);
        qb.addGroupBy(columnName);
      });

      // Always group by unit as well
      qb.addGroupBy('dashboard.unit');
    }

    // --- Handle Aggregations ---
    if (aggregate) {
      Object.entries(aggregate).forEach(([aggFunc, fields]) => {
        const fieldArray = Array.isArray(fields) ? fields : [fields];
        fieldArray.forEach((field) => {
          const columnName = this.mapFieldToColumn(field);
          const alias = `${aggFunc}_${field}`;
          switch (aggFunc.toLowerCase()) {
            case 'sum':
              qb.addSelect(`SUM(CAST(${columnName} AS DECIMAL(15,2)))`, alias);
              break;
            case 'avg':
              qb.addSelect(`AVG(CAST(${columnName} AS DECIMAL(15,2)))`, alias);
              break;
            case 'count':
              qb.addSelect(`COUNT(DISTINCT ${columnName})`, alias);
              break;
            case 'min':
              qb.addSelect(`MIN(CAST(${columnName} AS DECIMAL(15,2)))`, alias);
              break;
            case 'max':
              qb.addSelect(`MAX(CAST(${columnName} AS DECIMAL(15,2)))`, alias);
              break;
          }
        });
      });
    }

    // --- Handle Sorting ---
    let sortField = null;
    let sortOrder: 'ASC' | 'DESC' = 'ASC';

    if (sort && sort.field) {
      sortField = sort.field.replace(/([A-Z])/g, '_$1').toLowerCase();
      sortOrder = (sort.order?.toUpperCase() as 'ASC' | 'DESC') || 'ASC';
    } else if (xAxisField) {
      sortField = xAxisField.replace(/([A-Z])/g, '_$1').toLowerCase();
    }

    if (sortField) {
      const sortColumn = this.mapFieldToColumn(sortField);

      // ✅ If sort field not in group_by, include it
      const normalizedGroupBy = group_by.map((f) => f.replace(/([A-Z])/g, '_$1').toLowerCase());
      if (!normalizedGroupBy.includes(sortField)) {
        qb.addGroupBy(sortColumn);
      }

      // ✅ Smart sorting: handle 'M1'...'M12', 'Q1'...'Q4','H1'...'H2','FY'  style month values
      if (sortField === 'period') {
            qb.orderBy(
              `
              CASE
                WHEN ${sortColumn} REGEXP '^M[0-9]+$' THEN CAST(SUBSTRING(${sortColumn}, 2) AS UNSIGNED)
                WHEN ${sortColumn} REGEXP '^Q[0-9]+$' THEN 100 + CAST(SUBSTRING(${sortColumn}, 2) AS UNSIGNED)
                WHEN ${sortColumn} REGEXP '^H[0-9]+$' THEN 200 + CAST(SUBSTRING(${sortColumn}, 2) AS UNSIGNED)
                WHEN ${sortColumn} LIKE 'FY%' THEN 300
                ELSE 999
              END
              `,
              sortOrder
            );
      } else {
        qb.orderBy(sortColumn, sortOrder);
      }
    }

    // --- Apply limit ---
    if (limit && limit > 0) {
      qb.limit(limit);
    }

    return (await qb.getRawMany()).map(row => ({ ...row, sum_value: Number(row?.sum_value ?? 0), unit: (row?.unit ?? '') }));
  }

  async getFilterOptions() {
    const repo = this.getRepo(AiDashboardEntity);

    const locationDetails = await this.dataSource
      .getRepository(LocationEntity)
      .find();

    const locationMap = new Map(
      locationDetails.map((loc) => [loc.id, loc.unitCode])
    );

    const financialYears = await repo
      .createQueryBuilder('dashboard')
      .select('DISTINCT dashboard.financialYear', 'value')
      .where('dashboard.status = :status', { status: 1 })
      .orderBy('dashboard.financialYear', 'DESC')
      .getRawMany();

    const locations = await repo
      .createQueryBuilder('dashboard')
      .select('DISTINCT dashboard.locationId', 'value')
      .where('dashboard.status = :status', { status: 1 })
      .orderBy('dashboard.locationId', 'ASC')
      .getRawMany();

    const modules = await repo
      .createQueryBuilder('dashboard')
      .select('DISTINCT dashboard.module', 'value')
      .where('dashboard.status = :status', { status: 1 })
      .orderBy('dashboard.module', 'ASC')
      .getRawMany();

    const categories = await repo
      .createQueryBuilder('dashboard')
      .select('DISTINCT dashboard.category', 'value')
      .where('dashboard.status = :status', { status: 1 })
      .orderBy('dashboard.category', 'ASC')
      .getRawMany();

    const kpis = await repo
      .createQueryBuilder('dashboard')
      .select('DISTINCT dashboard.kpi', 'value')
      .where('dashboard.status = :status', { status: 1 })
      .orderBy('dashboard.kpi', 'ASC')
      .getRawMany();

    const periods = await repo
      .createQueryBuilder('dashboard')
      .select('DISTINCT dashboard.displayPeriods', 'value')
      .where('dashboard.status = :status', { status: 1 })
      .orderBy('dashboard.displayPeriods', 'ASC')
      .getRawMany();

    return {
      financialYears: financialYears.map((f) => ({
        label: f.value ?? 'N/A',
        value: f.value,
      })),

      // 🔹 Replace locationId with corresponding unit name from locationMap
      locations: locations
        .map((l) => {
          const locationName = locationMap.get(Number(l.value)) || null;
          if (!locationName) return null; // Skip if location not found
          return {
            label: locationName,
            value: locationName, // send name instead of ID
          };
        })
        .filter(Boolean), // remove nulls

      modules: modules.map((m) => ({
        label: m.value ? m.value.charAt(0).toUpperCase() + m.value.slice(1) : 'N/A',
        value: m.value,
      })),

      categories: categories.map((c) => ({
        label: c.value ?? 'N/A',
        value: c.value,
      })),

      kpis: kpis.map((k) => ({
        label: k.value ?? 'N/A',
        value: k.value,
      })),

      periods: periods.map((p) => ({
        label: p.value ?? 'N/A',
        value: p.value,
      })),
    };
  }

  // Map field names to database column names
  private mapFieldToColumn(field: string): string {
    const fieldMap: Record<string, string> = {
      'financial_year': 'dashboard.financialYear',
      'location_id': 'dashboard.locationId',
      'sublocation_id': 'dashboard.sublocationId',
      'question_id': 'dashboard.questionId',
      'sub_question_id': 'dashboard.subQuestionId',
      'from_date': 'dashboard.fromDate',
      'to_date': 'dashboard.toDate',
      'sub_category': 'dashboard.subCategory',
      'display_periods': 'dashboard.displayPeriods',
      'month': 'dashboard.period',
      'period': 'dashboard.period',
      'value': 'dashboard.value',
      'module': 'dashboard.module',
      'category': 'dashboard.category',
      'kpi': 'dashboard.kpi',
      'unit': 'dashboard.unit',
    };

    return fieldMap[field] || `dashboard.${field}`;
  }
}