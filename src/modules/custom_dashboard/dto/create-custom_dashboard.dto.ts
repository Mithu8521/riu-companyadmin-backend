import { IsString, IsObject, IsArray, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { WidgetConfig } from '../entities/published_bi_graphs.entity';

export class CreateBiGraphDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsObject()
  widgetConfig: WidgetConfig;

  @IsString()
  chartType: string;

  @IsOptional()
  @IsNumber()
  displayOrder?: number;

  @IsOptional()
  @IsNumber()
  dashboardId?: number;

  @IsOptional()
  @IsNumber()
  refreshInterval?: number;
}

export class UpdateBiGraphDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  widgetConfig?: WidgetConfig;

  @IsOptional()
  @IsString()
  chartType?: string;

  @IsOptional()
  @IsNumber()
  displayOrder?: number;

  @IsOptional()
  @IsNumber()
  refreshInterval?: number;
}

export class ReorderGraphsDto {
  @IsArray()
  graphOrders: Array<{ id: number; displayOrder: number }>;
}

export class GraphDataResponseDto {
  data: any[];
  metadata: {
    total: number;
    groupBy: string[];
    aggregate: Record<string, string | string[]>;
  };
}