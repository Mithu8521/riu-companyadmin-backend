import { Module } from '@nestjs/common';
import { AiDashboardService } from './ai_dashboard.service';
import { AiDashboardController } from './ai_dashboard.controller';
import { UtilsModule } from '@app/utils/utils.module';
import { DaoModule } from '../dao/dao.module';
import { SuperAdminClientModule } from '../super-admin-client/super-admin-client.module';

@Module({
  imports: [UtilsModule,DaoModule, SuperAdminClientModule],
  controllers: [AiDashboardController],
  providers: [AiDashboardService],
})

export class AiDashboardModule {}
