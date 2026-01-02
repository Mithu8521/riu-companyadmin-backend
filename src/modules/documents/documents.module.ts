import { Module, Req } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DaoModule } from '@modules/dao/dao.module';
import { UtilsModule } from '@utils/utils.module';
import { ReportingDocumentsMigrationService } from './reporting-documents-migration.service';
import { ReportingQuestionAnswerEntity } from '../reporting_module/entities/reporting_question_answer.entity';
import { FileMetadataEntity } from '../files-manager/entities/file-metdata.entity';
import { DocumentEntity } from './entities/document.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EsgReportingModule } from '../esg_reporting/esg_reporting.module';
import { FilesManagerModule } from '../files-manager/files-manager.module';
import { ReportingModuleModule } from '../reporting_module/reporting_module.module';
import { DocumentsService } from './documents.service';
import { UserModule } from '../setting/user/user.module';
import { SuperAdminClientModule } from '../super-admin-client/super-admin-client.module';
import { ReportingQuestionAnswerFactory } from './reporting-question-answers/reporting-question-answer.factory';
import { QualitativeReportingQuestionAnswer } from './reporting-question-answers/qualitative-reporting-question-answer';
import { QuantitativeReportingQuestionAnswer } from './reporting-question-answers/quantitative-reporting-question-answer';
import { QuantitativeTrendsReportingQuestionAnswer } from './reporting-question-answers/quantitative-trends-reporting-question-answer';
import { TabularReportingQuestionAnswer } from './reporting-question-answers/tabular-reporting-question-answer';
import { YesNoReportingQuestionAnswer } from './reporting-question-answers/yes-no-reporting-question-answer';
import { SectorDocumentsMigrationService } from './sector-documents-migration.service';


@Module({
  exports: [ReportingDocumentsMigrationService, SectorDocumentsMigrationService],
  imports: [
    UtilsModule,
    DaoModule,
    FilesManagerModule,
    ReportingModuleModule,
    EsgReportingModule,
    UserModule,
    SuperAdminClientModule,
    TypeOrmModule.forFeature([
      ReportingQuestionAnswerEntity
    ]),
  ],
  controllers: [DocumentsController],
  providers: [
    DocumentsService,
    ReportingDocumentsMigrationService,
    SectorDocumentsMigrationService,
    ReportingQuestionAnswerFactory,
    QualitativeReportingQuestionAnswer,
    QuantitativeReportingQuestionAnswer,
    QuantitativeTrendsReportingQuestionAnswer,
    TabularReportingQuestionAnswer,
    YesNoReportingQuestionAnswer
  ],
})
export class DocumentsModule {}
