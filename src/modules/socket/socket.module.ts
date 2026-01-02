// src/socket/socket.module.ts
import { forwardRef, Module } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { SocketService } from './socket.service';
import { ReportingModuleModule } from '../reporting_module/reporting_module.module';
import { NotificationModule } from '../setting/notification/notification.module';


@Module({
  imports: [forwardRef(() => ReportingModuleModule),  forwardRef(() => NotificationModule),],
  providers: [SocketGateway, SocketService],
  exports: [SocketGateway, SocketService],
})
export class SocketModule {}
