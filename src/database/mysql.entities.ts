import { CompanyEntity } from '@modules/setting/user/entities/user.entity';
import { TodaysActivity } from '@modules/dashboard/entities/today_activity.entity';
import { LocationEntity } from '@modules/setting/source/entities/source.entity';
import { RoleMasterEntity } from '@modules/setting/permission/entities/role-master.entity';
import { ProcessEntity } from '@modules/setting/process/entities/process.entity';
import { GraphFilterEntity } from '@modules/dashboard/entities/graph_filter.entity';
import { PermissionMasterEntity } from '@modules/setting/permission/entities/permission.entity';
import { DesignationEntity } from '@modules/setting/designation/entities/designation.entity';
import { SubUserEntity } from '@modules/setting/sub-user/entities/sub-user.entity';
import { EsgReportingEntity } from '@modules/esg_reporting/entities/esg_reporting.entity';
import { PasswordResetEntity } from '@modules/setting/user/entities/user_password_reset.entity';
import { FrameworkEntity } from '@modules/global_controles/framework/entities/framework.entity';
import { UserNotificationEntity } from '@modules/setting/user/entities/user_notification.entity';
import { PasswordHistoryEntity } from '@modules/setting/user/entities/users_password_history.entity';
import { SupplierAssessmentEntity } from '@modules/supplier_assessment/entities/supplier_assessment.entity';
import { TopicEntity } from '@modules/global_controles/topic/entities/topic.entity';
import { KpiEntity } from '@modules/global_controles/kpi/entities/kpi.entity';
import { AuditListingEntity } from '@modules/audit/entities/audit_listing.entity';
import { AuditHistoryEntity } from '@modules/audit/entities/audit_history.entity';
import { SectorQuestionEntity } from '@modules/global_controles/sector_question/entities/sector_question.entity';
import { SectorQuestionDetailsEntity } from '@modules/global_controles/sector_question/entities/sector_question_details.entity';
import { OrgChartEntity } from '@modules/setting/org_chart/entities/org_chart.entity';
import { AssignQuestionEntity } from '@modules/sector_question/entities/assign_question.entity';
import { SectorQuestionAnswerEntity } from '@modules/sector_question/entities/sector_question_answers.entity';
import { SectorQuestionTrendsAnswerEntity } from '@modules/sector_question/entities/sector_question_trends_answer.entity';
import { SectorQuestionTabularAnswerEntity } from '@modules/sector_question/entities/sector_tabular_question_answer.entity';
import { SectorQuestionHistoryAnswerEntity } from '@modules/sector_question/entities/sector_question_answers_history.entity';
import { SectorQuestionTrendsHistoryAnswerEntity } from '@modules/sector_question/entities/sector_question_trends_answer_history.entity';
import { SectorQuestionTabularHistoryAnswerEntity } from '@modules/sector_question/entities/sector_tabular_question_answer_history.entity';
import { AssessmentQuestionEntity } from '@modules/supplier_assessment/entities/create_assessment_question.entity';
import { AssessmentQuestionDetailsEntity } from '@modules/supplier_assessment/entities/assessment_question_details.entity';
import { AnswerFrequencyEntity } from '@modules/setting/frequency/entities/frequency.entity';
import { ReportingQuestionAnswerEntity } from '@modules/reporting_module/entities/reporting_question_answer.entity';
import { ReportingQuestionTargetDataEntity } from '@modules/set_target_data_question/entities/set_target_data_question.entity';
import { TrainingPrinciple } from '@modules/training/trainer/entities/training-principle.entity';
import { TrainingTopic } from '@modules/training/trainer/entities/training-topic.entity';
import { Training } from '@modules/training/trainer/entities/training.entity';
import { InvitedTrainee } from '@modules/training/trainer/entities/invited-trainee.entity';
import { EmissionSetting } from '@modules/setting/emission/entities/emission.entity';
import { Unit } from '@modules/setting/unit/entities/unit.entity';
import { TraineeUser } from '@modules/training/trainee/entities/external-trainee-resister.entity';
import { SubLocationEntity } from '@modules/setting/source/entities/sub-location.entity';
import { ReportingArchiveEntity } from '@modules/reporting_archive_module/entities/reporting_archive_module.entity';
import { EmailHistoryEntity } from '@modules/setting/user/entities/email_history.entity';
import { ReportingQuestionHistoryAnswerEntity } from '@modules/reporting_module/entities/reporting_question_answer_history.entity';
import { UserActivityLog } from '@modules/setting/user/entities/user_activity_logs';
import { GhgDataBaseEntity } from '@modules/setting/gwp/entities/gwp.entity';
import { EmissionScopeEntity } from '@modules/carban_emission/entities/emission_calculation.entity';
import { IntensityEntity } from '@modules/intensity/entities/intensity.entity';
import { ReportGenerationSettingEntity } from '@modules/sector_question/entities/report-generation-settings.entity';
import { QuestionDueDateEntity } from '@modules/setting/email_notifications_and_due_date/entities/email_notifications_and_due_date.entity';
import { EmailNotificationsEntity } from '@modules/setting/email_notifications_and_due_date/entities/emial_notifications.entity';
import { DocumentEntity } from '@app/modules/documents/entities/document.entity';
import { FileMetadataEntity } from '@app/modules/files-manager/entities/file-metdata.entity';
import { PeriodLockEntity } from '@modules/setting/lock_question/entities/lock_question.entity';
import { ReportingDueDateOverrideEntity } from '@modules/reporting_module/entities/reporting_question_approval.entity';
import { AiDashboardEntity } from '@app/modules/ai_dashboard/entities/ai_dashboard.entity';
import { UserPromptHistoryEntity } from '@app/modules/ai_dashboard/entities/user_prompt_history.entity';
import { PublishGraphEntity } from '@app/modules/ai_dashboard/entities/publish_graph.entity';
import { PublishedCustomGraphEntity } from '@app/modules/custom_dashboard/entities/published_bi_graphs.entity';
import { ReportingChatEntity } from '@app/modules/reporting_module/entities/chat.entity';
import { WebNotificationEntity } from '@app/modules/setting/notification/entity/notification.entity';
import { DashboardDataSource } from '@app/modules/custom_dashboard/entities/dashboard-data-sources.entity';


export const MYSQL_ENTITIES = [
  CompanyEntity,
  TodaysActivity,
  LocationEntity,
  RoleMasterEntity,
  GraphFilterEntity,
  PasswordResetEntity,
  PasswordHistoryEntity,
  PermissionMasterEntity,
  UserNotificationEntity,
  ProcessEntity,
  DesignationEntity,
  SubUserEntity,
  EsgReportingEntity,
  FrameworkEntity,
  TopicEntity,
  KpiEntity,
  SectorQuestionEntity,
  SectorQuestionDetailsEntity,
  OrgChartEntity,
  AuditListingEntity,
  AuditHistoryEntity,
  SupplierAssessmentEntity,
  AssessmentQuestionEntity,
  AssessmentQuestionDetailsEntity,
  AssignQuestionEntity,
  SectorQuestionAnswerEntity,
  SectorQuestionTrendsAnswerEntity,
  SectorQuestionTabularAnswerEntity,
  SectorQuestionHistoryAnswerEntity,
  SectorQuestionTrendsHistoryAnswerEntity,
  SectorQuestionTabularHistoryAnswerEntity,
  AnswerFrequencyEntity,
  ReportingQuestionAnswerEntity,
  ReportingQuestionTargetDataEntity,
  TrainingPrinciple,
  TrainingTopic,
  Training,
  InvitedTrainee,
  EmissionSetting,
  Unit,
  TraineeUser,
  SubLocationEntity,
  ReportingArchiveEntity,
  EmailHistoryEntity,
  FileMetadataEntity,
  DocumentEntity,
  ReportingQuestionHistoryAnswerEntity,
  UserActivityLog,
  GhgDataBaseEntity,
  EmissionScopeEntity,
  IntensityEntity,
  ReportGenerationSettingEntity,
  QuestionDueDateEntity,
  EmailNotificationsEntity,
  PeriodLockEntity,
  ReportingDueDateOverrideEntity,
  AiDashboardEntity,
  UserPromptHistoryEntity,
  PublishGraphEntity,
  PublishedCustomGraphEntity,
  ReportingChatEntity,
  WebNotificationEntity,
  DashboardDataSource
];