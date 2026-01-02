import { Module } from '@nestjs/common';
import { PermissionService } from './permission.service';
import { PermissionController } from './permission.controller';
import { UtilsModule } from '@utils/utils.module';
import { DaoModule } from '@modules/dao/dao.module';

@Module({
  imports: [UtilsModule,DaoModule],
  controllers: [PermissionController],
  providers: [PermissionService],
})
export class PermissionModule {}
