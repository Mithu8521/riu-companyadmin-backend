import { Module } from '@nestjs/common';
import { FilesManagerService } from './files-manager.service';
import { FilesManagerController } from './files-manager.controller';
import { UtilsModule } from '@utils/utils.module';
import { MulterModule } from '@nestjs/platform-express';
import { DaoModule } from '@modules/dao/dao.module';

@Module({
  imports: [UtilsModule, DaoModule],
  controllers: [FilesManagerController],
  providers: [FilesManagerService],
  exports: [FilesManagerService]
})
export class FilesManagerModule {}
