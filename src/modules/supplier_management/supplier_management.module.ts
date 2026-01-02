import { Module } from '@nestjs/common';
import { SupplierManagementService } from './supplier_management.service';
import { SupplierManagementController } from './supplier_management.controller';
import { UtilsModule } from '@utils/utils.module';
import { DaoModule } from '@modules/dao/dao.module';

@Module({
  imports: [UtilsModule,DaoModule],
  controllers: [SupplierManagementController],
  providers: [SupplierManagementService],
})
export class SupplierManagementModule {}
