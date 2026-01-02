import { Module } from '@nestjs/common';
import { TrainerService } from './trainer.service';
import { TrainerController } from './trainer.controller';
import { UtilsModule } from '@utils/utils.module';
import { DaoModule } from '@modules/dao/dao.module';

@Module({
  imports: [UtilsModule,DaoModule],
  controllers: [TrainerController],
  providers: [TrainerService],
})
export class TrainerModule {}
