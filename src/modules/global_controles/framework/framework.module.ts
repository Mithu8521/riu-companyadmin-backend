import { Module } from '@nestjs/common';
import { FrameworkService } from './framework.service';
import { FrameworkController } from './framework.controller';
import { DaoModule } from '@modules/dao/dao.module';
import { UtilsModule } from '@utils/utils.module';

@Module({
  imports: [UtilsModule,DaoModule],
  controllers: [FrameworkController],
  providers: [FrameworkService],
})
export class FrameworkModule {}
