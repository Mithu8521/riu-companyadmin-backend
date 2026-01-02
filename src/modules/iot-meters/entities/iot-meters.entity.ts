import {
  Entity,
  Column,
  PrimaryColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity({ name: "riu_iot_meters" })
@Index("idx_meter_gateway", ["gatewayId"])
@Index("idx_meter_source", ["sourceId"])
@Index("idx_meter_location", ["subLocationId"])
@Index("idx_meter_kpi", ["kpi"])
export class IotMeterEntity {
  /* -------------------- Primary -------------------- */

  @PrimaryColumn({ name: "meter_id", type: "varchar", length: 100 })
  meterId: string; // Unique Meter ID (business key)

  /* -------------------- Meter Details -------------------- */

  @Column({ name: "meter_type", type: "varchar", length: 50 })
  meterType: string; // Smart, Analog, Virtual, etc.

  @Column({ name: "gateway_id", type: "varchar", length: 100})
  gatewayId: string | null;

  @Column({ name: "source_id", type: "int" })
  sourceId: number | null;

  @Column({ name: "sub_location_id", type: "int", nullable: true })
  subLocationId: number | null;

  /* -------------------- Classification -------------------- */

  @Column({ type: "varchar", length: 50 })
  module: string; // ESG / Energy / Water / Fuel

  @Column({ type: "varchar", length: 50 })
  category: string; // Electricity, Water, Fuel

  @Column({ name: "sub_category", type: "varchar", length: 50, nullable: true })
  subCategory: string | null; // Renewable / Non-renewable

  @Column({ name: "kpi", type: "varchar", length: 100 })
  kpi: string; // Grid Electricity, Ground Water, etc.

  /* -------------------- Status -------------------- */

  @Column({
    name: "is_active",
    type: "boolean",
    default: true,
  })
  isActive: boolean;

  /* -------------------- Metadata -------------------- */

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;
}
