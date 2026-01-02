import { Logger, Module, OnApplicationShutdown } from '@nestjs/common';
import 'winston-daily-rotate-file';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { ConfigModule } from './config/config.module';
import { ConfigService } from './config/config.service';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UtilsModule } from './utils/utils.module';
import { Subject } from 'rxjs';
import { CommonUtilityService } from './utils/common/common-utility/common-utility.service';
import { ScheduleModule } from '@nestjs/schedule';
import { UserModule } from './modules/setting/user/user.module';
import { KpiModule } from './modules/global_controles/kpi/kpi.module';
import { DaoModule } from '@modules/dao/dao.module';
import { DatabaseModule } from './database/database.module';
import { PermissionModule } from '@modules/setting/permission/permission.module';
import { SourceModule } from '@modules/setting/source/source.module';
import { ProcessModule } from '@modules/setting/process/process.module';
import { BillingModule } from '@modules/setting/billing/billing.module';
import { DesignationModule } from '@modules/setting/designation/designation.module';
import { SubUserModule } from '@modules/setting/sub-user/sub-user.module';
import { OrgChartModule } from '@modules/setting/org_chart/org_chart.module';
import { EsgReportingModule } from '@modules/esg_reporting/esg_reporting.module';
import { SectorQuestionModule } from '@modules/sector_question/sector_question.module';
import { FrameworkModule } from '@modules/global_controles/framework/framework.module';
import { TopicModule } from '@modules/global_controles/topic/topic.module';
import { CustomSectorQuestionModule } from '@modules/global_controles/sector_question/sector_question.module';
import { SocketModule } from '@modules/socket/socket.module';
import { DashboardModule } from '@modules/dashboard/dashboard.module';
import { AuditModule } from '@modules/audit/audit.module';
import { FilesManagerModule } from '@app/modules/files-manager/files-manager.module';
import { SupplierManagementModule } from '@modules/supplier_management/supplier_management.module';
import { SupplierAssessmentModule } from '@modules/supplier_assessment/supplier_assessment.module';
import { ReportingModuleModule } from '@modules/reporting_module/reporting_module.module';
import { FrequencyModule } from '@modules/setting/frequency/frequency.module';
import { EmissionModule } from '@modules/setting/emission/emission.module';
import { ReportingArchiveModuleModule } from '@modules/reporting_archive_module/reporting_archive_module.module';
import { SetTargetDataQuestionModule } from '@modules/set_target_data_question/set_target_data_question.module';
import { TrainerModule } from '@modules/training/trainer/trainer.module';
import { TraineeModule } from '@modules/training/trainee/trainee.module';
import { UnitModule } from '@modules/setting/unit/unit.module';
import { CarbanEmissionModule } from '@modules/carban_emission/carban_emission.module';
import { GwpModule } from '@modules/setting/gwp/gwp.module';
import { IntensityModule } from '@modules/intensity/intensity.module';
import { EmailNotificationsAndDueDateModule } from '@modules/setting/email_notifications_and_due_date/email_notifications_and_due_date.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { SuperAdminClientModule } from './modules/super-admin-client/super-admin-client.module';
import { LockQuestionModule } from '@modules/setting/lock_question/lock_question.module';
import { AiDashboardModule } from './modules/ai_dashboard/ai_dashboard.module';
import { CustomDashboardModule } from './modules/custom_dashboard/custom_dashboard.module';
import { PuppeteerChartModule } from './modules/puppeteer-chart/puppeteer-chart.module';


import { NotificationController } from './modules/setting/notification/notification.controller';
import { NotificationModule } from './modules/setting/notification/notification.module';
import { IotMetersModule } from './modules/iot-meters/iot-meters.module';
const { combine, splat, timestamp, printf } = winston.format;

const NFTLogFormat = printf(
  ({ level, message, timestamp, ...metadata }) =>
    `[CRYR-API-CHANNEL] [${process.pid}] ${CommonUtilityService.getModifiedDate(
      new Date(),
    )} [${level}] - ${message}\n`,
);

@Module({
  imports: [
    ScheduleModule.forRoot(),
    // ServeStaticModule.forRoot({
    //   rootPath: join(__dirname, '..', 'public'),
    // }),
    WinstonModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return configService.isEnv('dev')
          ? {
              level: 'debug',
              format: winston.format.json(),
              defaultMeta: { service: 'user-service' },
              transports: [
                new winston.transports.File({
                  filename: 'logs/debug.log',
                  level: 'debug',
                }),
                new winston.transports.Console({
                  format: winston.format.simple(),
                }),
              ],
            }
          : {
              level: 'info',
              format: combine(
                winston.format.colorize(),
                splat(),
                timestamp(),
                NFTLogFormat,
              ),
              defaultMeta: { service: 'user-service' },
              transports: [
                new winston.transports.File({
                  filename: 'logs/error.log',
                  level: 'error',
                }),
                new winston.transports.Console({
                  format: winston.format.simple(),
                }),
                // new rotateFile({
                // 	filename: "app_log_%DATE%.log",
                // 	dirname: join("./log/"),
                // 	datePattern: "YYYY-MM-DD",
                // 	zippedArchive: true,
                // 	maxSize: "250m",
                // 	maxFiles: "14d",
                // 	level: "info"
                // })
              ],
            };
      },
    }),
    DatabaseModule,
    FrameworkModule,
    TopicModule,
    KpiModule,
    CustomSectorQuestionModule,
    UserModule,
    UtilsModule,
    DaoModule,
    PermissionModule,
    SourceModule,
    ProcessModule,
    BillingModule,
    DesignationModule,
    SubUserModule,
    OrgChartModule,
    ProcessModule,
    EsgReportingModule,
    SectorQuestionModule,
    OrgChartModule,
    SocketModule,
    DashboardModule,
    AuditModule,
    FilesManagerModule,
    SupplierManagementModule,
    SupplierAssessmentModule,
    ReportingModuleModule,
    FrequencyModule,
    EmissionModule,
    ReportingArchiveModuleModule,
    SetTargetDataQuestionModule,
    TrainerModule,
    TraineeModule,
    UnitModule,
    CarbanEmissionModule,
    GwpModule,
    IntensityModule,
    EmailNotificationsAndDueDateModule,
    DocumentsModule,
    SuperAdminClientModule,
    LockQuestionModule,
    AiDashboardModule,
    CustomDashboardModule,
    PuppeteerChartModule,
    NotificationModule,
    IotMetersModule,
    
 ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements OnApplicationShutdown {
  private readonly logger = new Logger(AppModule.name);
  private readonly shutdownListener$: Subject<void> = new Subject();

  onApplicationShutdown = async (signal: string): Promise<void> => {
    if (!signal) return;
    this.logger.log(`Detected signal: ${signal}`);

    this.shutdownListener$.next();
  };

  subscribeToShutdown = (shutdownFn: () => void): void => {
    this.shutdownListener$.subscribe(() => {
      this.logger.log('App is closed');
      shutdownFn();
    });
  };
}
