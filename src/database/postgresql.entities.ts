import { KpiMeterReading } from "@app/modules/iot-meters/entities/kpi-meter-readings.entity";
import { IotMeterEntity } from "@app/modules/iot-meters/entities/iot-meters.entity";
import { RawEvent } from "@app/modules/iot-meters/entities/raw-events.entity";


export const POSTGRESQL_ENTITIES = [
  IotMeterEntity,
  KpiMeterReading,
  RawEvent
]