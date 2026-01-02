import { Module } from '@nestjs/common';
import { ReportingArchiveModuleService } from './reporting_archive_module.service';
import { ReportingArchiveModuleController } from './reporting_archive_module.controller';
import { UtilsModule } from '@utils/utils.module';
import { DaoModule } from '@modules/dao/dao.module';

@Module({
  imports: [UtilsModule,DaoModule],
  controllers: [ReportingArchiveModuleController],
  providers: [ReportingArchiveModuleService],
})
export class ReportingArchiveModuleModule {}
