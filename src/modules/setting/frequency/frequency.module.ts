import { Module } from '@nestjs/common';
import { FrequencyService } from './frequency.service';
import { FrequencyController } from './frequency.controller';
import { UtilsModule } from '@utils/utils.module';
import { DaoModule } from '@modules/dao/dao.module';

@Module({
  imports: [UtilsModule,DaoModule],
  controllers: [FrequencyController],
  providers: [FrequencyService],
})
export class FrequencyModule {}
