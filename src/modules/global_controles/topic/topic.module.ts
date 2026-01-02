import { Module } from '@nestjs/common';
import { TopicService } from './topic.service';
import { TopicController } from './topic.controller';
import { DaoModule } from '@modules/dao/dao.module';
import { UtilsModule } from '@utils/utils.module';

@Module({
  imports: [UtilsModule,DaoModule],
  controllers: [TopicController],
  providers: [TopicService],
})
export class TopicModule {}
