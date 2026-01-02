import { Module } from '@nestjs/common';
import { SourceService } from './source.service';
import { SourceController } from './source.controller';
import { DaoModule } from '@modules/dao/dao.module';
import { UtilsModule } from '@utils/utils.module';

@Module({
  imports: [UtilsModule,DaoModule],
  controllers: [SourceController],
  providers: [SourceService],
})
export class SourceModule {}
