import { forwardRef, Module } from '@nestjs/common';
import { ReportingModuleService } from './reporting_module.service';
import { ReportingModuleController } from './reporting_module.controller';
import { DaoModule } from '@modules/dao/dao.module';
import { SocketModule } from '@modules/socket/socket.module';
import { UtilsModule } from '@utils/utils.module';
import { SuperAdminClientModule } from '../super-admin-client/super-admin-client.module';
import { MigrateManipalTabularToTrendsService } from './migrate-manipal-tabular-to-trends';
import { NotificationModule } from '../setting/notification/notification.module';

@Module({
  imports: [UtilsModule,DaoModule, forwardRef(() => SocketModule),SuperAdminClientModule, NotificationModule],
  exports: [ReportingModuleService, MigrateManipalTabularToTrendsService],
  controllers: [ReportingModuleController],
  providers: [ReportingModuleService, MigrateManipalTabularToTrendsService],
})
export class ReportingModuleModule {}
