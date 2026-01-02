import { Module } from '@nestjs/common';
import { SubUserService } from './sub-user.service';
import { SubUserController } from './sub-user.controller';
import { DaoModule } from '@modules/dao/dao.module';
import { UtilsModule } from '@utils/utils.module';
import { SocketModule } from '@modules/socket/socket.module';

@Module({
  imports: [UtilsModule,DaoModule,SocketModule],
  controllers: [SubUserController],
  providers: [SubUserService],
})
export class SubUserModule {}
