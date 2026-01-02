import { Module } from '@nestjs/common';
import { GwpService } from './gwp.service';
import { GwpController } from './gwp.controller';
import { UtilsModule } from '@utils/utils.module';
import { DaoModule } from '@modules/dao/dao.module';

@Module({
  imports: [UtilsModule, DaoModule],
  controllers: [GwpController],
  providers: [GwpService],
})
export class GwpModule { }
