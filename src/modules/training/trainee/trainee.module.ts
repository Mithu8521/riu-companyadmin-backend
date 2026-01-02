import { Module } from '@nestjs/common';
import { TraineeService } from './trainee.service';
import { TraineeController } from './trainee.controller';
import { UtilsModule } from '@utils/utils.module';
import { DaoModule } from '@modules/dao/dao.module';

@Module({
  imports: [UtilsModule,DaoModule],
  controllers: [TraineeController],
  providers: [TraineeService],
})
export class TraineeModule {}
