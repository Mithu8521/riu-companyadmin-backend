import { Module } from '@nestjs/common';
import { CarbanEmissionService } from './carban_emission.service';
import { CarbanEmissionController } from './carban_emission.controller';
import { UtilsModule } from '@utils/utils.module';
import { DaoModule } from '@modules/dao/dao.module';
import { SuperAdminClientModule } from '@modules/super-admin-client/super-admin-client.module';


@Module({
  imports: [
    UtilsModule,
    DaoModule,
    SuperAdminClientModule
  ],
  controllers: [
    CarbanEmissionController
  ],
  providers: [
    CarbanEmissionService
  ],
})
export class CarbanEmissionModule {}
