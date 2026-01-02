import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron } from '@nestjs/schedule';

import { RawEvent } from '../../entities/raw-events.entity';
import { IotMeterEntity } from '../../entities/iot-meters.entity';
import { KpiMeterReading } from '../../entities/kpi-meter-readings.entity';
import { MeasurementType } from '../../enums/measurement-type.enum';

import { SuperAdminClientService } from '@app/modules/super-admin-client/super-admin-client.service';
import { UserDaoService } from '@app/modules/dao/setting/user-dao/user-dao.service';

type FyDetails = {
  startFy: Date;
  endFy: Date;
  fyVal: string;
};

@Injectable()
export class RawEventTransformer implements OnModuleInit {
  private readonly logger = new Logger(RawEventTransformer.name);

  constructor(
    @InjectRepository(RawEvent, 'postgresql')
    private readonly rawRepo: Repository<RawEvent>,

    @InjectRepository(IotMeterEntity, 'postgresql')
    private readonly meterRepo: Repository<IotMeterEntity>,

    @InjectRepository(KpiMeterReading, 'postgresql')
    private readonly kpiRepo: Repository<KpiMeterReading>,

    private readonly superAdminClientService: SuperAdminClientService,
    private readonly userDaoService: UserDaoService,
  ) {}

  async onModuleInit() {
    this.logger.log('🚀 RawEventTransformer initialized');
  }

  @Cron('*/30 * * * * *') // every 30 seconds
  async handleCron() {
    // await this.processBatch(100);
  }

  // async processBatch(limit = 100) {
  //   const rawEvents = await this.rawRepo.find({
  //     where: { status: 'PENDING' },
  //     order: { id: 'ASC' },
  //     take: limit,
  //   });

  //   if (!rawEvents.length) return;

  //   this.logger.log(`📦 Found ${rawEvents.length} raw events`);

  //   /** STEP 1: fetch company FY config */
  //   const company =
  //     await this.userDaoService.getHeadOfficeCompanyDetails(true);

  //   const startMonth = Number(company.starting_month); // 1-12
  //   const startMonthIndex = startMonth - 1; // JS Date index

  //   /** STEP 2: fetch allowed FYs */
  //   const financialYears =
  //     await this.superAdminClientService.getFinancialYears(362);

  //   /** STEP 3: build FY date-range map */
  //   const fyMap: FyDetails[] = financialYears.map(fy => {
  //     const [startYear, endYear] =
  //       fy.financial_year_value.split('-').map(Number);

  //     const fromDate = new Date(Date.UTC(startYear, startMonthIndex, 1, 0, 0, 0));
  //     const toDate = new Date(
  //       Date.UTC(endYear, startMonthIndex, 0, 23, 59, 59),
  //     );

  //     return {
  //       startFy: fromDate,
  //       endFy: toDate,
  //       fyVal: fy.financial_year_value,
  //     };
  //   });

  //   /** STEP 4: process each raw event */
  //   for (const raw of rawEvents) {
  //     try {
  //       const meter = await this.meterRepo.findOne({
  //         where: { meterId: raw.deviceId, isActive: true },
  //       });

  //       if (!meter) {
  //         throw new Error(`Inactive or missing meter: ${raw.deviceId}`);
  //       }

  //       const payload = raw.payload;

  //       if (typeof payload.reading !== 'number') {
  //         throw new Error('Invalid reading');
  //       }

  //       if (!payload.unit) {
  //         throw new Error('Missing unit');
  //       }

  //       /** STEP 5: resolve FY by date range */
  //       const eventTime = raw.deviceTime.getTime();

  //       const matchedFy = fyMap.find(
  //         fy =>
  //           eventTime >= fy.startFy.getTime() &&
  //           eventTime <= fy.endFy.getTime(),
  //       );

  //       if (!matchedFy) {
  //         throw new Error(
  //           `No matching FY for timestamp ${raw.deviceTime.toISOString()}`,
  //         );
  //       }

  //       /** STEP 6: insert KPI reading */
  //       await this.kpiRepo.insert({
  //         timestamp: raw.deviceTime,
  //         financialYear: matchedFy.fyVal,
  //         module: meter.module,
  //         category: meter.category,
  //         subCategory: meter.subCategory,
  //         kpi: meter.kpi,
  //         meterId: raw.deviceId,
  //         gatewayId: meter.gatewayId,
  //         sourceId: meter.sourceId,
  //         subLocationId: meter.subLocationId,
  //         reading: payload.reading.toString(),
  //         unit: payload.unit,
  //         measurementType: MeasurementType.INTERVAL,
  //       });

  //       await this.rawRepo.update(raw.id, { status: 'PROCESSED' });

  //       this.logger.log(`✅ Processed raw_event ${raw.id}`);
  //     } catch (err: any) {
  //       await this.rawRepo.update(raw.id, {
  //         retryCount: () => 'retry_count + 1',
  //         errorReason: err.message,
  //         status: 'PENDING',
  //       });

  //       this.logger.error(
  //         `❌ Failed raw_event ${raw.id}: ${err.message}`,
  //       );
  //     }
  //   }
  // }
}
