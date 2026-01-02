import { Module } from '@nestjs/common';
import { EmissionService } from './emission.service';
import { EmissionController } from './emission.controller';
import { UtilsModule } from '@utils/utils.module';
import { DaoModule } from '@modules/dao/dao.module';

@Module({
  imports: [UtilsModule,DaoModule],
  controllers: [EmissionController],
  providers: [EmissionService],
})
export class EmissionModule {}
