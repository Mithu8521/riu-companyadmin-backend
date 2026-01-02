import { KpiMeterReading } from '@app/modules/iot-meters/entities/kpi-meter-readings.entity';
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';


@Injectable()
export class IotMetersDaoService {
    constructor(
      @InjectDataSource('postgresql')
      private readonly dataSource: DataSource,
    ) {}

  async getAllDashboardFilters() {
    return await this.dataSource
      .getRepository(KpiMeterReading)
      .createQueryBuilder("r")
      .select([
        'r.module AS "module"',
        'r.category AS "category"',
        'r.subCategory AS "subCategory"',
        'r.kpi AS "kpi"',
        'r.meterId AS "meterId"',
      ])
      .groupBy('r.module')
      .addGroupBy('r.category')
      .addGroupBy('r.subCategory')
      .addGroupBy('r.kpi')
      .addGroupBy('r.meterId')
      .orderBy('r.module', 'ASC')
      .addOrderBy('r.category', 'ASC')
      .addOrderBy('r.subCategory', 'ASC')
      .addOrderBy('r.kpi', 'ASC')
      .addOrderBy('r.meterId', 'ASC')
      .getRawMany();
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

  async processWidgetQuery(xAxisField: string, stackByField: string, widgetConfig: any) {
    const { module, filters, group_by = [], sort, limit, aggregateSubLocations } = widgetConfig;

    const { startDateTime, endDateTime, aggregationPeriodUnit, aggregationPeriodValue, ...rawFilters } = filters;

    if (!module?.length) {
      throw new Error('Module is mandatory');
    }

    if (stackByField === 'displayPeriods') {
      throw new Error('displayPeriods cannot be used as stackByField');
    }

    const { conditions, params } = this.buildTypeOrmFilterConditions(
      module,
      startDateTime,
      endDateTime,
      rawFilters
    );

    /* ============================================================
      NON-PERIOD CASE
      ============================================================ */
    if (xAxisField !== 'displayPeriods') {
      const qb = this.dataSource
        .getRepository(KpiMeterReading)
        .createQueryBuilder('dashboard');

      // apply all filters
      conditions.forEach((condition, idx) => {
        if (idx === 0) qb.where(condition, params);
        else qb.andWhere(condition, params);
      });

      qb.select('dashboard.unit', 'unit');
      qb.addGroupBy('dashboard.unit');

      group_by.forEach((field) => {
        const column = this.mapFieldToColumn('dashboard', field);
        qb.addSelect(column, field).addGroupBy(column);
      });

      qb.addSelect(
        `MAX(CAST(dashboard.reading AS DECIMAL(18,6))) - MIN(CAST(dashboard.reading AS DECIMAL(18,6)))`,
        'value'
      );

      if (sort?.field) {
        qb.orderBy(
          this.mapFieldToColumn('dashboard', sort.field),
          sort.order?.toUpperCase() || 'ASC'
        );
      }

      if (limit) qb.limit(limit);

      return (await qb.getRawMany()).map(r => ({
        ...r,
        value: Number(r.value ?? 0),
        unit: r.unit ?? ''
      }));
    }

    /* ============================================================
      PERIOD CASE — generate_series + MAX-delta logic
      ============================================================ */

    if (!aggregationPeriodUnit) {
      throw new Error('aggregationPeriodUnit is required for displayPeriods');
    }

    const qb = this.dataSource
      .getRepository(KpiMeterReading)
      .createQueryBuilder('dashboard')
      .select('dashboard.unit', 'unit')
      .groupBy('dashboard.unit')
      .limit(2);

    conditions.forEach((condition, index) => {
      if (index === 0) {
        qb.where(condition, params);
      } else {
        qb.andWhere(condition, params);
      }
    });

    const units = await qb.getRawMany();

    // units.length === 0 → no rows → OK
    // units.length === 1 → single unit → OK
    if (units.length > 1) {
      throw new Error('Mismatched units');
    }

    const interval =
      aggregationPeriodUnit === 'minutes' ? '1 minute' :
      aggregationPeriodUnit === 'hours'   ? '1 hour' :
      aggregationPeriodUnit === 'days'    ? '1 day' :
                                            '1 month';

    const displayFormat =
      aggregationPeriodUnit === 'minutes' ? 'DD Mon HH24:MI' :
      aggregationPeriodUnit === 'hours'   ? 'DD Mon HH24:00' :
      aggregationPeriodUnit === 'days'    ? 'DD Mon' :
                                            'Mon';

    const lookbackIntervals =
      aggregationPeriodUnit === 'minutes' ? 43200 :
        aggregationPeriodUnit === 'hours' ? 720 :
        aggregationPeriodUnit === 'days'  ? 30 :
                                            1;

    const { conditionsTemplate, conditionsParams } = this.buildRawSqlFilterConditions(
      module,
      startDateTime,
      endDateTime,
      rawFilters
    );

    const sqlTemplate = `
      WITH periods AS (
        SELECT generate_series({{start}}::timestamptz, {{end}}::timestamptz, {{interval}}::interval, 'Asia/Kolkata') AS period_start
      )
      SELECT
        p.period_start AS period_ts,
        to_char(p.period_start, {{displayFormat}}) AS "displayPeriods",
        MAX(r.reading) - COALESCE(MAX(MAX(r.reading)) OVER (ORDER BY p.period_start ROWS BETWEEN ${lookbackIntervals} PRECEDING AND 1 PRECEDING), 0) AS value,
        {{unit}} AS unit
      FROM periods p
      LEFT JOIN kpi_meter_readings r
        ON r.timestamp >= p.period_start
        AND r.timestamp <  p.period_start + {{interval}}::interval
        AND ${conditionsTemplate}
      GROUP BY p.period_start, r.unit
      ORDER BY p.period_start ASC;
    `;

    params.start = startDateTime;
    params.end = endDateTime;
    params.interval = interval;
    params.displayFormat = displayFormat;
    params.unit = units?.[0]?.unit ?? '';
    Object.assign(params, conditionsParams);

    const {sql, values } = this.compileRawSQL(sqlTemplate, params);

    const rows = await this.dataSource.query(sql, values);

    return rows.map(r => ({
      displayPeriods: r.displayPeriods,
      timestamp: r.period_ts,
      sum_value: Math.max(Number(r.value ?? 0), 0),
      unit: r.unit ?? '',
    }));
  }

  private buildRawSqlFilterConditions(module: string[], startDateTime?: string, endDateTime?: string, rawFilters?: Record<string, any>): {conditionsTemplate: string; conditionsParams: Record<string, any>;} {
    const conditions: string[] = [];
    const conditionsParams: Record<string, any> = {};

    // mandatory module filter
    conditions.push('r.module IN ({{modules}})');
    conditionsParams.modules = module;

    // time filter
    if (startDateTime && endDateTime) {
      conditions.push('r.timestamp BETWEEN {{start}} AND {{end}}');
      conditionsParams.start = startDateTime;
      conditionsParams.end = endDateTime;
    }

    // dynamic filters
    Object.entries(rawFilters || {}).forEach(([key, value]) => {
      if (!value || (Array.isArray(value) && !value.length)) return;

      const normalized = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      // const column = this.mapFieldToColumn('r', normalized);

      conditions.push(`r.${normalized} IN ({{${normalized}}})`);
      conditionsParams[normalized] = Array.isArray(value) ? value.join(',') : value;
    });

    const conditionsTemplate = conditions.length > 0 ? conditions.join(' AND ') : '1=1';
    return { conditionsTemplate , conditionsParams };
  }

  private buildTypeOrmFilterConditions(module: string[], startDateTime?: string, endDateTime?: string, rawFilters?: Record<string, any>): {conditions: string[]; params: Record<string, any>;} {
    const conditions: string[] = [];
    const params: Record<string, any> = {};

    // mandatory module filter
    conditions.push('dashboard.module IN (:...modules)');
    params.modules = module;

    // time filter
    if (startDateTime && endDateTime) {
      conditions.push('dashboard.timestamp BETWEEN :start AND :end');
      params.start = startDateTime;
      params.end = endDateTime;
    }

    // dynamic filters
    Object.entries(rawFilters || {}).forEach(([key, value]) => {
      if (!value || (Array.isArray(value) && !value.length)) return;

      const normalized = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      const column = this.mapFieldToColumn('dashboard', normalized);

      conditions.push(`${column} IN (:...${normalized})`);
      params[normalized] = Array.isArray(value) ? value : [value];
    });

    return { conditions, params };
  }

  private compileRawSQL(sqlTemplate: string, paramMap: Record<string, any>): {sql: string, values: any[]} {
    const values: any[] = [];
    let index = 1;

    const sql = sqlTemplate.replace(
      /\{\{(\w+)\}\}/g,
      (_, key) => {
        const value = paramMap[key];

        if (Array.isArray(value)) {
          const placeholders = value.map(() => `$${index++}`);
          values.push(...value);
          return placeholders.join(', ');
        }

        values.push(value);
        return `$${index++}`;
      }
    );

    return { sql, values };
  }


  private mapFieldToColumn(alias: string, field: string): string {
    const fieldMap: Record<string, string> = {
      'financial_year': `${alias}.financialYear`,
      'module': `${alias}.module`,
      'category': `${alias}.category`,
      'sub_category': `${alias}.subCategory`,
      'kpi': `${alias}.kpi`,
      'meter_id': `${alias}.meterId`,
      'location_id': `${alias}.sourceId`,
      'sublocation_id': `${alias}.sublocationId`,
      'value': `${alias}.reading`,
      'unit': `${alias}.unit`,
    };

    return fieldMap[field] || `dashboard.${field}`;
  }

}
