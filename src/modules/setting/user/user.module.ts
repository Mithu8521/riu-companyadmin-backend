import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UtilsModule } from "src/utils/utils.module";
import { DaoModule } from '@modules/dao/dao.module';
import { JwtModule } from '@nestjs/jwt';
@Module({
  imports: [ UtilsModule,DaoModule, JwtModule.register({
    secret:  "secret",
    signOptions: { expiresIn: '48h' },
  })],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService]
})
export class UserModule {}
