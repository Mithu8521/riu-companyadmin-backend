import { Controller, Post, Req, } from '@nestjs/common';
import { TriggerReminderService } from './trigger_reminder.service';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Trigger Email for Reminder')
@Controller('v1.0')
export class TriggerReminderController {
  constructor(private readonly triggerReminderService: TriggerReminderService) {}

  @Post('postLogin/emailforWeeklyReminder')
  @ApiOperation({ summary: 'Email for Weekly Reminder' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Email for Weekly Reminder', type: '', })
  emailforWeeklyReminder(@Req() request) {
    return this.triggerReminderService.emailforWeeklyReminder( request);
  }


  @Post('postLogin/emailforPerformanceReport')
  @ApiOperation({ summary: 'Email for Performance Report' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Email for Performance Report', type: '', })
  emailforPerformanceReport( @Req() request) {
    return this.triggerReminderService.emailforPerformanceReport( request);
  }



  
}
