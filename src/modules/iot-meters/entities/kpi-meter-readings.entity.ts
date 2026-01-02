import {
  Entity,
  Column,
  PrimaryColumn,
  Index,
  CreateDateColumn,
} from "typeorm";

import { MeasurementType } from "../enums/measurement-type.enum";

@Entity({ name: "kpi_meter_readings" })
@Index("idx_kpi_time", ["kpi", "timestamp"])
@Index("idx_meter_time", ["meterId", "timestamp"])
@Index("idx_gateway_time", ["gatewayId", "timestamp"])
@Index("idx_source_time", ["sourceId", "timestamp"])
@Index("idx_kpi_meter_timestamp", ["kpi", "meterId", "timestamp"]) 
export class KpiMeterReading {

  /* -------------------- Primary (Timescale requirement) -------------------- */

  @PrimaryColumn("uuid", {
    default: () => "gen_random_uuid()",
  })
  id: string;

  @PrimaryColumn({ type: "timestamptz" })
  timestamp: Date;

  /* -------------------- Dimension Columns -------------------- */

  @Column({ name: "financial_year", type: "text" })
  financialYear: string;

  @Column({ type: "text" })
  module: string; // Energy, Water etc.

  @Column({ type: "text" })
  category: string; // Fuel, Water, Electricity

  @Column({ name: "sub_category", type: "text", nullable: true })
  subCategory: string | null; // Renewable, Non-Renewable

  @Column({ type: "text" })
  kpi: string; // Ground Water, Grid Electricity

  @Column({ name: "meter_id", type: "text" })
  meterId: string;

  @Column({ name: "gateway_id", type: "text", nullable: true })
  gatewayId: string | null;

  @Column({ name: "source_id", type: "int", nullable: true })
  sourceId: number | null;

  @Column({ name: "sub_location_id", type: "int", nullable: true })
  subLocationId: number | null;

  /* -------------------- Time-Series Values -------------------- */

  @Column({ type: "numeric", precision: 18, scale: 6 })
  reading: string; // numeric → string to avoid JS float loss

  @Column({ type: "text" })
  unit: string;

  @Column({
    name: "measurement_type",
    type: "enum",
    enum: MeasurementType,
  })
  measurementType: MeasurementType;

  /* -------------------- Metadata -------------------- */

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;
}
