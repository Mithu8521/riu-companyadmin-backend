import { Module } from '@nestjs/common';
import { SectorQuestionService } from './sector_question.service';
import { SectorQuestionController } from './sector_question.controller';
import { UtilsModule } from '@utils/utils.module';
import { DaoModule } from '@modules/dao/dao.module';
import { SocketModule } from '@modules/socket/socket.module';
import { SuperAdminClientModule } from '@modules/super-admin-client/super-admin-client.module';

@Module({
  imports: [UtilsModule,DaoModule,SocketModule, SuperAdminClientModule],
  controllers: [SectorQuestionController],
  providers: [SectorQuestionService],
})
export class SectorQuestionModule {}
