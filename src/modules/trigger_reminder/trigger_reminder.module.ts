import { Module } from '@nestjs/common';
import { TriggerReminderService } from './trigger_reminder.service';
import { TriggerReminderController } from './trigger_reminder.controller';

@Module({
  controllers: [TriggerReminderController],
  providers: [TriggerReminderService],
})
export class TriggerReminderModule {}
