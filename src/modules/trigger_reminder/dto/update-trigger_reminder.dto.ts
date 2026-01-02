import { PartialType } from '@nestjs/mapped-types';
import { CreateTriggerReminderDto } from './create-trigger_reminder.dto';

export class UpdateTriggerReminderDto extends PartialType(CreateTriggerReminderDto) {}
