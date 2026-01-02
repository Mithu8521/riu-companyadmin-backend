import { Module } from '@nestjs/common';
import { UtilsModule } from '@app/utils/utils.module';
import { DaoModule } from '../dao/dao.module';
import { CustomGraphController } from './custom_dashboard.controller';
import { CustomGraphService } from './custom_dashboard.service';
import { SuperAdminClientModule } from '../super-admin-client/super-admin-client.module';

@Module({
  imports: [UtilsModule, DaoModule, SuperAdminClientModule],
  controllers: [CustomGraphController],
  providers: [CustomGraphService],
})
export class CustomDashboardModule { }


