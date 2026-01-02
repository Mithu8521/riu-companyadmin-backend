/**
 * ESG Chart Data Transformer Utility
 * Transforms raw ESG data into Chart.js compatible options
 */

export interface RawDataPoint {
  displayPeriods: string;
  kpi?: string;
  sum_value: number;
  value?: number;
  unit?: string; // Unit can vary per KPI (e.g., Diesel=L, Coal=Kg)
  category?: string;
  sub_category?: string;
  [key: string]: any; // Allow additional dynamic fields
}

export interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'doughnut';
  title?: string;
  unit?: string; // Default unit if all KPIs share same unit
  yAxisLabel?: string;
  colorScheme?: string[];
  stacked?: boolean;
  percentage?: boolean;
  showDataLabels?: boolean;
  dataLabelThreshold?: number;
  groupByFields?: string[]; // Dynamic group_by fields from widget config
  supportedOrder?: string[]; 
  showUnitsInTooltip?: boolean; // Show per-KPI units in tooltips (default: true)
  showUnitsInDataLabels?: boolean; // Show units in data labels (default: false for mixed units)
}

export interface AggregatedData {
  [period: string]: {
    [kpi: string]: number;
  };
}

export interface AggregatedDataWithUnits {
  data: AggregatedData;
  unitMap: { [groupingValue: string]: string }; // Maps each KPI/sub_category to its unit
}

export class ChartDataTransformer {
  // TODO: Fix the color coding
  private static readonly PRIMARY_COLORS = [
    '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#14b8a6',
    '#93c5fd', '#86efac', '#fcd34d', '#c4b5fd', '#fbcfe8', '#67e8f9', '#fdba74', '#5eead4',
    '#1e40af', '#047857', '#b45309', '#6d28d9', '#be185d', '#0e7490', '#c2410c', '#0f766e'
  ]
  private static readonly COLORS_MAP = {
    red: '#ef4444',
    yellow: '#fbbf24',
    white: '#d1d5db',
    cytotoxic: '#9333ea',
    blue: '#3b82f6',
    male: '#3b82f6',
    female: '#ec4899'
  };

  /**
   * Aggregate raw data by grouping fields
   * Also extracts unit information for each grouping value
   * @param rawData - Array of raw data points
   * @param groupByFields - Array of fields to group by (from widget config)
   */
  private static aggregateData(rawData: RawDataPoint[], groupByFields: string[]): AggregatedDataWithUnits {
    const aggregated: AggregatedData = {};
    const unitMap: { [groupingValue: string]: string } = {};

    const primaryField = groupByFields[0] || 'displayPeriods';
    const secondaryField = groupByFields.length > 1 ? groupByFields[1] : 'kpi';

    rawData.forEach(item => {
      const primaryKey = item[primaryField] || 'Unknown';
      const secondaryKey = item[secondaryField] || 'Unknown';

      if (!aggregated[primaryKey]) aggregated[primaryKey] = {};
      if (!aggregated[primaryKey][secondaryKey]) aggregated[primaryKey][secondaryKey] = 0;

      aggregated[primaryKey][secondaryKey] += Number(item.sum_value) || 0;

      // Store unit
      if (item.unit && !unitMap[secondaryKey]) unitMap[secondaryKey] = item.unit;
    });

    return { data: aggregated, unitMap };
  }

  private static extractPrimaryGroups(
    rawData: RawDataPoint[],
    groupByFields: string[],
    supportedOrder?: string[]
  ): string[] {
    // If user provided an explicit order (e.g., months, quarters, etc.)
    if (supportedOrder && supportedOrder.length > 0) {
      // Ensure all supportedOrder values appear, even if missing in data
      return supportedOrder;
    }

    const primaryField = groupByFields[0] || 'displayPeriods';
    const uniqueValues = [...new Set(rawData.map(item => item[primaryField]))].filter(Boolean);

    return uniqueValues;
  }

  /**
   * Extract unique grouping values (KPIs, sub_categories, categories, etc.) from raw data
   * @param rawData - Array of raw data points
   * @param groupByFields - Array of fields to group by
   */
  private static extractGroupingValues(rawData: RawDataPoint[], groupByFields: string[]): string[] {
    const groupingField = groupByFields.length > 1 ? groupByFields[1] : 'kpi';
    const values = [...new Set(rawData.map(item => item[groupingField]))];
    return values.filter(value => value !== null && value !== undefined && value !== '');
  }

  /**
   * Get color scheme based on chart type or custom colors
   */
  private static getColorScheme(config: ChartConfig, groupingValueCount: number): string[] {
    if (config.colorScheme && config.colorScheme.length > 0) {
      return config.colorScheme;
    }

    return this.PRIMARY_COLORS;
  }

  /**
   * Create datasets for grouped/stacked bar charts
   */
  private static createBarDatasets(
    aggregatedData: AggregatedData,
    primaryGroups: string[],
    groupingValues: string[],
    config: ChartConfig,
    unitMap?: { [key: string]: string }
  ) {
    const colors = this.getColorScheme(config, groupingValues.length);
    const datasets = [];

    groupingValues.forEach((groupValue, index) => {
      const data = primaryGroups.map(period => aggregatedData[period]?.[groupValue] || 0);
      
      // Add unit to label if available
      const unit = unitMap?.[groupValue];
      const label = unit && unit !== 'Number' ? `${groupValue} (${unit})` : groupValue;

      const baseColor = this.COLORS_MAP?.[groupValue.toLowerCase()] ?? colors[index % colors.length];
      datasets.push({
        label: label,
        data: data,
        backgroundColor: baseColor,
        borderColor: this.darkenColor(baseColor, 20),
        borderWidth: 2,
        borderRadius: 6,
        barThickness: 24
      });
    });

    return datasets;
  }

  /**
   * Create datasets for line charts
   */
  private static createLineDatasets(
    aggregatedData: AggregatedData,
    primaryGroups: string[],
    groupingValues: string[],
    config: ChartConfig,
    unitMap?: { [key: string]: string }
  ) {
    const colors = this.getColorScheme(config, groupingValues.length);
    const datasets = [];

    groupingValues.forEach((groupValue, index) => {
      const data = primaryGroups.map(period => aggregatedData[period]?.[groupValue] || 0);
      
      // Add unit to label if available
      const unit = unitMap?.[groupValue];
      const label = unit && unit !== 'Number' ? `${groupValue} (${unit})` : groupValue;
      const baseColor = this.COLORS_MAP?.[groupValue.toLowerCase()] ?? colors[index % colors.length];
      datasets.push({
        label: label,
        data: data,
        borderColor: baseColor,
        backgroundColor: this.addAlpha(baseColor, 0.1),
        borderWidth: 3,
        fill: config.stacked ? true : false,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: baseColor,
        pointBorderColor: '#fff',
        pointBorderWidth: 2
      });
    });

    return datasets;
  }

  /**
   * Create datasets for pie/doughnut charts (single period)
   */
  private static createPieDatasets(
    aggregatedData: AggregatedData,
    periods: string[],
    groupingValues: string[],
    config: ChartConfig,
    unitMap?: { [key: string]: string }
  ) {
    const colors = this.getColorScheme(config, groupingValues.length);
    const latestPeriod = periods[periods.length - 1];
    const data = groupingValues.map(groupValue => aggregatedData[latestPeriod]?.[groupValue] || 0);

    // Create labels with units for pie/doughnut charts
    const labelsWithUnits = groupingValues.map(groupValue => {
      const unit = unitMap?.[groupValue];
      return unit && unit !== 'Number' ? `${groupValue} (${unit})` : groupValue;
    });

    return [{
      data: data,
      backgroundColor: groupingValues.map(
        (v, i) => this.COLORS_MAP?.[v.toLowerCase()] ?? colors[i % colors.length]
      ),
      borderColor: '#fff',
      borderWidth: 2
    }];
  }

  /**
   * Darken a hex color by a percentage
   */
  private static darkenColor(hex: string, percent: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) - amt;
    const G = (num >> 8 & 0x00FF) - amt;
    const B = (num & 0x0000FF) - amt;
    return '#' + (
      0x1000000 + 
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    ).toString(16).slice(1);
  }

  /**
   * Add alpha transparency to hex color
   */
  private static addAlpha(hex: string, alpha: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const R = (num >> 16);
    const G = (num >> 8 & 0x00FF);
    const B = (num & 0x0000FF);
    return `rgba(${R}, ${G}, ${B}, ${alpha})`;
  }

  /**
   * Transform raw data to Chart.js options
   * @param rawData - Array of raw data points
   * @param config - Chart configuration
   */
  public static transform(rawData: RawDataPoint[], config: ChartConfig) {
    // Default groupByFields if not provided
    const groupByFields = config.groupByFields || ['displayPeriods', 'kpi'];
    
    const aggregatedDataWithUnits = this.aggregateData(rawData, groupByFields);
    const aggregatedData = aggregatedDataWithUnits.data;
    const unitMap = aggregatedDataWithUnits.unitMap;
    const primaryGroups = this.extractPrimaryGroups(rawData, groupByFields, config.supportedOrder);
    const groupingValues = this.extractGroupingValues(rawData, groupByFields);

    let datasets;
    let labels;

    // Create datasets based on chart type
    switch (config.type) {
      case 'line':
        datasets = this.createLineDatasets(aggregatedData, primaryGroups, groupingValues, config, unitMap);
        labels = primaryGroups;
        break;
      case 'pie':
      case 'doughnut':
        datasets = this.createPieDatasets(aggregatedData, primaryGroups, groupingValues, config, unitMap);
        // Use labels with units for pie/doughnut charts
        labels = groupingValues.map(groupValue => {
          const unit = unitMap?.[groupValue];
          return unit && unit !== 'Number' ? `${groupValue} (${unit})` : groupValue;
        });
        break;
      case 'bar':
      default:
        datasets = this.createBarDatasets(aggregatedData, primaryGroups, groupingValues, config, unitMap);
        labels = primaryGroups;
        break;
    }

    // Build chart options with unit map
    const chartOptions: any = {
      type: config.type,
      data: {
        labels: labels,
        datasets: datasets
      },
      options: this.buildOptions(config, unitMap)
    };

    return chartOptions;
  }

  /**
   * Build chart options configuration
   */
  private static buildOptions(config: ChartConfig, unitMap?: { [key: string]: string }) {
    const isPieChart = config.type === 'pie' || config.type === 'doughnut';
    const hasMixedUnits = unitMap && Object.keys(unitMap).length > 1 && new Set(Object.values(unitMap)).size > 1;
    
    const options: any = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true, // Always show legends
          position: isPieChart ? 'right' : 'bottom',
          labels: {
            padding: 15,
            font: {
              size: 12
            },
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          titleFont: {
            size: 14,
            weight: 'bold'
          },
          bodyFont: {
            size: 13
          },
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          callbacks: {
            label: (context: any) => {
              let label = context.dataset.label || '';
              if (label && !isPieChart) {
                label += ': ';
              }
              const value = context.parsed.y ?? context.parsed;
              const formattedValue = value.toLocaleString('en-US', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
              });
              
              // For tooltips, just show the value since unit is already in legend
              label += formattedValue;
              
              if (config.percentage && isPieChart) {
                const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                label += ` (${percentage}%)`;
              }
              
              return label;
            }
          }
        }
      }
    };

    // Add data labels plugin config - always show numbers on top of bars
    if (config.type === 'bar' || config.type === 'line') {
      options.plugins.datalabels = {
        display: true, // Always show data labels on bars
        anchor: 'end',
        align: 'top',
        offset: 4,
        color: '#1a202c',
        font: {
          size: 10,
          weight: 'bold'
        },
        formatter: (value: number, context: any) => {
          if (value === 0) return '';
          
          // Format the number with appropriate suffix
          let formattedValue = '';
          if (value >= 1000000) {
            formattedValue = (value / 1000000).toFixed(1) + 'M';
          } else if (value >= 1000) {
            formattedValue = (value / 1000).toFixed(1) + 'K';
          } else {
            formattedValue = value.toFixed(0);
          }
          
          return formattedValue;
        }
      };
    } else if (config.showDataLabels !== false && isPieChart) {
      // For pie charts, optionally show data labels if configured
      options.plugins.datalabels = {
        display: (context: any) => {
          const value = context.parsed;
          return value > (config.dataLabelThreshold || 0);
        },
        color: '#fff',
        font: {
          size: 11,
          weight: 'bold'
        },
        formatter: (value: number, context: any) => {
          if (value === 0) return '';
          
          const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
          const percentage = ((value / total) * 100).toFixed(1);
          return `${percentage}%`;
        }
      };
    }

    // Add scales for bar and line charts
    if (!isPieChart) {
      options.categoryPercentage = 0.7;
      options.barPercentage = 0.9;
      
      // Y-axis label: show generic label if mixed units
      let yAxisLabel = config.yAxisLabel || '';
      if (!yAxisLabel && config.unit && !hasMixedUnits) {
        yAxisLabel = `Value (${config.unit})`;
      } else if (!yAxisLabel && hasMixedUnits) {
        yAxisLabel = 'Value (Mixed Units)';
      }
      
      options.scales = {
        x: {
          stacked: config.stacked || false,
          grid: {
            display: false
          },
          ticks: {
            font: {
              size: 13,
              weight: '600'
            },
            color: '#4a5568'
          }
        },
        y: {
          stacked: config.stacked || false,
          beginAtZero: true,
          grid: {
            color: '#e2e8f0',
            drawBorder: false
          },
          ticks: {
            font: {
              size: 12
            },
            color: '#718096',
            callback: (value: number) => {
              if (config.percentage) {
                return value + '%';
              }
              if (value >= 1000000) {
                return (value / 1000000).toFixed(0) + 'M';
              } else if (value >= 1000) {
                return (value / 1000).toFixed(0) + 'K';
              }
              return value;
            }
          },
          title: {
            display: !!yAxisLabel,
            text: yAxisLabel,
            font: {
              size: 13,
              weight: 'bold'
            },
            color: '#4a5568'
          }
        }
      };

      options.interaction = {
        intersect: false,
        mode: 'index'
      };
    }

    return options;
  }

  /**
   * Quick transform methods for common ESG charts
   */
  public static toGroupedBar(
    rawData: RawDataPoint[], 
    title: string, 
    unit?: string, 
    groupByFields?: string[]
  ) {
    return this.transform(rawData, {
      type: 'bar',
      title,
      unit,
      yAxisLabel: unit && unit !== 'Number' ? `Consumption (${unit})` : 'Value',
      stacked: false,
      groupByFields
    });
  }

  public static toStackedBar(
    rawData: RawDataPoint[], 
    title: string, 
    unit?: string,
    groupByFields?: string[],
    supportedOrder?: string[]
  ) {
    return this.transform(rawData, {
      type: 'bar',
      title,
      unit,
      yAxisLabel: unit && unit !== 'Number' ? `Total (${unit})` : 'Total',
      stacked: true,
      groupByFields,
      supportedOrder
    });
  }

  public static toPercentageStackedBar(
    rawData: RawDataPoint[], 
    title: string,
    groupByFields?: string[],
    supportedOrder?: string[]
  ) {
    return this.transform(rawData, {
      type: 'bar',
      title,
      yAxisLabel: 'Percentage (%)',
      stacked: true,
      percentage: true,
      groupByFields,
      supportedOrder
    });
  }

  public static toLineChart(
    rawData: RawDataPoint[], 
    title: string, 
    unit?: string,
    groupByFields?: string[],
    supportedOrder?: string[]
  ) {
    return this.transform(rawData, {
      type: 'line',
      title,
      unit,
      yAxisLabel: unit && unit !== 'Number' ? `Value (${unit})` : 'Value',
      stacked: false,
      groupByFields,
      supportedOrder
    });
  }

  public static toPieChart(
    rawData: RawDataPoint[], 
    title: string, 
    unit?: string,
    groupByFields?: string[]
  ) {
    return this.transform(rawData, {
      type: 'pie',
      title,
      unit,
      percentage: true,
      groupByFields
    });
  }

  public static toDoughnutChart(
    rawData: RawDataPoint[], 
    title: string, 
    unit?: string,
    groupByFields?: string[],
    supportedOrder?: string[]
  ) {
    return this.transform(rawData, {
      type: 'doughnut',
      title,
      unit,
      percentage: true,
      groupByFields,
      supportedOrder
    });
  }
}

// Export default instance
export default ChartDataTransformer;