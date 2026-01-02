import { Module } from '@nestjs/common';
import { OrgChartService } from './org_chart.service';
import { OrgChartController } from './org_chart.controller';
import { DaoModule } from '@modules/dao/dao.module';
import { UtilsModule } from '@utils/utils.module';

@Module({
  imports: [UtilsModule,DaoModule],
  controllers: [OrgChartController],
  providers: [OrgChartService],
})
export class OrgChartModule {}
