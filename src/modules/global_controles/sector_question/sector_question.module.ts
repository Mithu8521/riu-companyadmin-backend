import { Module } from '@nestjs/common';
import { SectorQuestionService } from './sector_question.service';
import { SectorQuestionController } from './sector_question.controller';
import { DaoModule } from '@modules/dao/dao.module';
import { UtilsModule } from '@utils/utils.module';

@Module({
  imports: [UtilsModule,DaoModule],
  controllers: [SectorQuestionController],
  providers: [SectorQuestionService],
})
export class CustomSectorQuestionModule {}
