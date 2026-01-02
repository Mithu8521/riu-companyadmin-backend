import { Module } from '@nestjs/common';
import { SupplierAssessmentService } from './supplier_assessment.service';
import { SupplierAssessmentController } from './supplier_assessment.controller';
import { UtilsModule } from '@utils/utils.module';
import { DaoModule } from '@modules/dao/dao.module';

@Module({
  imports: [UtilsModule,DaoModule],
  controllers: [SupplierAssessmentController],
  providers: [SupplierAssessmentService],
})
export class SupplierAssessmentModule {}
