// notification.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { WebNotificationEntity } from './entity/notification.entity';
import { SocketModule } from '@app/modules/socket/socket.module';
import { ReportingModuleModule } from '@app/modules/reporting_module/reporting_module.module';


@Module({
  imports: [
    TypeOrmModule.forFeature([WebNotificationEntity]),
    forwardRef(() => SocketModule),
    forwardRef(() => ReportingModuleModule),
  ],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService]
})
export class NotificationModule {}