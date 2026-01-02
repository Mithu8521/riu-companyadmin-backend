import { Module } from '@nestjs/common';
import { EsgReportingService } from './esg_reporting.service';
import { EsgReportingController } from './esg_reporting.controller';
import { UtilsModule } from '@utils/utils.module';
import { DaoModule } from '@modules/dao/dao.module';

@Module({
  imports: [UtilsModule,DaoModule],
  exports: [EsgReportingService], 
  controllers: [EsgReportingController],
  providers: [EsgReportingService],
})
export class EsgReportingModule {}
