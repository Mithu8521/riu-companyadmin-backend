import { Module } from '@nestjs/common';
import { UserDaoService } from './setting/user-dao/user-dao.service';
import { SourceDaoService } from './setting/source-dao/source-dao.service';
import { RoleMasterDaoService } from './setting/role-master-dao/role-master-dao.service';
import { PermissionMasterDaoService } from './setting/permission-master-dao/permission-master-dao.service';
import { DesignationDaoService } from './setting/designation-dao/designation-dao.service';
import { ProcessDaoService } from './setting/process-dao/process-dao.service';
import { SubUserDaoService } from './setting/sub-user-dao/sub-user-dao.service';
import { EsgReportingDaoService } from './esg-reporting-dao/esg-reporting-dao.service';
import { FrameworkDaoService } from './global_controles/framework-dao/framework-dao.service';
import { TopicDaoService } from './global_controles/topic-dao/topic-dao.service';
import { KpiDaoService } from './global_controles/kpi-dao/kpi-dao.service';
import { SectorQuestionDaoService } from './global_controles/sector-question-dao/sector-question-dao.service';
import { OrgChartDaoService } from './setting/org-chart-dao/org-chart-dao.service';
import { SectorQuestionDaoModuleService } from './sector-question-dao-module/sector-question-dao-module.service';
import { AuditListingDaoService } from './audit/audit-listing-dao/audit-listing-dao.service';
import { AuditHistoryDaoService } from './audit/audit-history-dao/audit-history-dao.service';
import { DashboardDaoService } from './dashboard-dao/dashboard-dao.service';
import { SupplierAssessmentDaoService } from './supplier-assessment-dao/supplier-assessment-dao.service';
import { SupplierManagementDaoService } from './supplier-management-dao/supplier-management-dao.service';
import { ReportingModuleDaoService } from './reporting-module-dao/reporting-module-dao.service';
import { AnswerFrequencyDaoService } from './setting/answer-frequency-dao/answer-frequency-dao.service';
import { ReportingArchiveModuleDaoService } from './reporting-archive-module-dao/reporting-archive-module-dao.service';
import { SetTargetDataQuestionDaoService } from './set_target_data_question-dao/set_target_data_question-dao.service';
import { TrainingDaoService } from './training/training-dao/training-dao.service';
import { TraineeDaoService } from './training/trainee-dao/trainee-dao.service';
import { EmissionDaoService } from './setting/emission-dao/emission-dao.service';
import { UnitDaoService } from './setting/unit-dao/unit-dao.service';
import { CarbonEmissionDaoService } from './carbon_emission-dao/carbon_emission-dao.service';
import { GwpDaoService } from './setting/gwp-dao/gwp-dao.service';
import { IntensityDaoService } from './intensity-dao/intensity-dao.service';
import { EmailNotificationsAndDueDateDaoService } from './setting/email_notifications_and_due_date-dao/email_notifications_and_due_date-dao.service';
import { FilesManagerDaoService } from './files-manager-dao/files-manager-dao.service';
import { DocumentsDaoService } from './documents-dao/documents-dao.service';
import { LockQuestionDaoService } from './setting/lock_question-dao/lock_question-dao.service';
import { AiDashboardDaoService } from './ai_dashboard-dao/ai_dashboard-dao.service';
import { CustomDashboardDaoService } from './custom-dashboard-dao/custom-dashboard-dao.service';
import { IotMetersDaoService } from './iot-meters-dao/iot-meters-dao.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KpiMeterReading } from '../iot-meters/entities/kpi-meter-readings.entity';
import { RawEvent } from '../iot-meters/entities/raw-events.entity';
import { IotMeterEntity } from '../iot-meters/entities/iot-meters.entity';


@Module({
  imports: [
    TypeOrmModule.forFeature([
        KpiMeterReading,
        RawEvent,
        IotMeterEntity
      ],
      'postgresql'
    ),
  ],
  providers: [
    UserDaoService,
    SourceDaoService,
    RoleMasterDaoService,
    PermissionMasterDaoService,
    DesignationDaoService,
    ProcessDaoService,
    SubUserDaoService,
    EsgReportingDaoService,
    FrameworkDaoService,
    TopicDaoService,
    KpiDaoService,
    SectorQuestionDaoService,
    OrgChartDaoService,
    SectorQuestionDaoModuleService,
    AuditListingDaoService,
    AuditHistoryDaoService,
    DashboardDaoService,
    SupplierAssessmentDaoService,
    SupplierManagementDaoService,
    ReportingModuleDaoService,
    AnswerFrequencyDaoService,
    ReportingArchiveModuleDaoService,
    SetTargetDataQuestionDaoService,
    TrainingDaoService,
    TraineeDaoService,
    EmissionDaoService,
    UnitDaoService,
    CarbonEmissionDaoService,
    GwpDaoService,
    IntensityDaoService,
    EmailNotificationsAndDueDateDaoService,
    FilesManagerDaoService,
    DocumentsDaoService,
    LockQuestionDaoService,
    AiDashboardDaoService,
    CustomDashboardDaoService,
    IotMetersDaoService
  ],
  exports: [
    UserDaoService,
    SourceDaoService,
    RoleMasterDaoService,
    PermissionMasterDaoService,
    DesignationDaoService,
    ProcessDaoService,
    SubUserDaoService,
    EsgReportingDaoService,
    FrameworkDaoService,
    TopicDaoService,
    KpiDaoService,
    SectorQuestionDaoService,
    OrgChartDaoService,
    SectorQuestionDaoModuleService,
    AuditListingDaoService,
    AuditHistoryDaoService,
    DashboardDaoService,
    SupplierAssessmentDaoService,
    SupplierManagementDaoService,
    AnswerFrequencyDaoService,
    ReportingModuleDaoService,
    ReportingArchiveModuleDaoService,
    SetTargetDataQuestionDaoService,
    TrainingDaoService,
    TraineeDaoService,
    EmissionDaoService,
    UnitDaoService,
    CarbonEmissionDaoService,
    GwpDaoService,
    IntensityDaoService,
    EmailNotificationsAndDueDateDaoService,
    FilesManagerDaoService,
    DocumentsDaoService,
    LockQuestionDaoService,
    AiDashboardDaoService,
    CustomDashboardDaoService,
    IotMetersDaoService,
  ],
})

export class DaoModule {}