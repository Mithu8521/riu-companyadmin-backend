import { Module } from '@nestjs/common';
import { SetTargetDataQuestionService } from './set_target_data_question.service';
import { SetTargetDataQuestionController } from './set_target_data_question.controller';
import { UtilsModule } from '@utils/utils.module';
import { DaoModule } from '@modules/dao/dao.module';
import { SocketModule } from '@modules/socket/socket.module';

@Module({
  imports: [UtilsModule,DaoModule,SocketModule],
  controllers: [SetTargetDataQuestionController],
  providers: [SetTargetDataQuestionService],
})
export class SetTargetDataQuestionModule {}
