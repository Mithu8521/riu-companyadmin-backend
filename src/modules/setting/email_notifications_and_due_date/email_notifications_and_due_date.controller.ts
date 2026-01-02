import { Controller, Get, Post, Body, Param, Delete, UseGuards, Query, Req, Put } from '@nestjs/common';
import { EmailNotificationsAndDueDateService } from './email_notifications_and_due_date.service';
import { CreateEmailNotificationAndDueDateDto } from './dto/create-email_notifications_and_due_date.dto';
import { VerifyTokenGuard } from '@utils/guards/verify-token/verify-token.guards';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiTags, ApiQuery } from '@nestjs/swagger';

@UseGuards(VerifyTokenGuard)
@ApiTags('email-notification-due-date')
@Controller('v1.0')
export class EmailNotificationsAndDueDateController {
  constructor(private readonly emailNotificationsAndDueDateService: EmailNotificationsAndDueDateService) { }

  @Post('postLogin/emailNotification')
  @ApiOperation({ summary: 'Save Email Notification Configuration' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  saveEmailReminder(@Body() createEmailReminderDto: CreateEmailNotificationAndDueDateDto, @Req() request) {
    return this.emailNotificationsAndDueDateService.saveEmailReminder(createEmailReminderDto, request);
  }

  @Get('postLogin/scheduledNotifications')
  @ApiOperation({ summary: 'Get Email Notification by Financial Year' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiQuery({ name: 'financialYear', required: true, type: 'number' })
  getEmailReminders(@Req() request) {
    return this.emailNotificationsAndDueDateService.getEmailReminders(request);
  }

  @Get('postLogin/emailNotificationConfiguration')
  @ApiOperation({ summary: 'Get Email Notification by Financial Year' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiQuery({ name: 'financialYear', required: true, type: 'number' })
  emailNotificationConfiguration(@Req() request) {
    return this.emailNotificationsAndDueDateService.emailNotificationConfiguration(request);
  }

  @Post('preLogin/performanceReport/report')
  @ApiOperation({ summary: 'Send Performance Report Email' })
  performanceReportToAdmin(@Req() request) {
    return this.emailNotificationsAndDueDateService.runCronSetup(request);
  }
}