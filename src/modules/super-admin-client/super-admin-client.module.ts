import { Module } from '@nestjs/common';
import { UtilsModule } from "src/utils/utils.module";
import { SuperAdminClientService } from './super-admin-client.service';


@Module({
  imports: [ UtilsModule ],
  providers: [SuperAdminClientService],
  exports: [SuperAdminClientService],

})
export class SuperAdminClientModule {}
