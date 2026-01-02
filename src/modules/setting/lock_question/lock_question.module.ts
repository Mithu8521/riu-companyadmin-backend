import { Module } from '@nestjs/common';
import { LockQuestionService } from './lock_question.service';
import { LockQuestionController } from './lock_question.controller';
import { DaoModule } from '@modules/dao/dao.module';
import { UtilsModule } from '@utils/utils.module';

@Module({
  imports: [UtilsModule,DaoModule],
  controllers: [LockQuestionController],
  providers: [LockQuestionService],
})
export class LockQuestionModule {}
