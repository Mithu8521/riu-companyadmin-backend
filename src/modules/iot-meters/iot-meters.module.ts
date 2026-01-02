import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IotMetersService } from './iot-meters.service';
import { IotMetersController } from './iot-meters.controller';

import { RawEvent } from './entities/raw-events.entity';
import { IotMeterEntity } from './entities/iot-meters.entity';
import { KpiMeterReading } from './entities/kpi-meter-readings.entity';

import { MqttConsumer } from './workers/mqtt-ingestion/mqtt-ingestion.worker';
import { RawEventTransformer } from './workers/transformer/raw-transformer.worker';
import { SuperAdminClientModule } from '../super-admin-client/super-admin-client.module';
import { DaoModule } from '../dao/dao.module';

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [RawEvent, IotMeterEntity, KpiMeterReading],
      'postgresql',
    ),
    SuperAdminClientModule,
    DaoModule
    ],
  controllers: [IotMetersController],
  providers: [
    IotMetersService,
    MqttConsumer,
    RawEventTransformer,
  ],
})
export class IotMetersModule {}
