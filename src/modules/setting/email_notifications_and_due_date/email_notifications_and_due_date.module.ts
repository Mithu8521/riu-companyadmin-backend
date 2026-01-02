import { Module } from '@nestjs/common';
import { DaoModule } from '@modules/dao/dao.module';
import { UtilsModule } from '@utils/utils.module';
import { EmailNotificationsAndDueDateController } from './email_notifications_and_due_date.controller';
import { EmailNotificationsAndDueDateService } from './email_notifications_and_due_date.service';
import { SuperAdminClientModule } from '@app/modules/super-admin-client/super-admin-client.module';
import { PuppeteerChartModule } from '@app/modules/puppeteer-chart/puppeteer-chart.module';

@Module({
  imports: [UtilsModule, DaoModule, SuperAdminClientModule, PuppeteerChartModule],
  controllers: [EmailNotificationsAndDueDateController],
  providers: [EmailNotificationsAndDueDateService],
})
export class EmailNotificationsAndDueDateModule { }
