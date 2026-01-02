// src/notification/notification.controller.ts
import { Controller, Get, Post, Body, Req, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiResponse, ApiTags, ApiBody } from '@nestjs/swagger';
import { NotificationService } from './notification.service';

@ApiTags('WebNotifications')
@Controller('v1.0/postLogin/webNotifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get notifications for current user' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'JWT token', required: true })
  @ApiResponse({ status: 200, description: 'List of notifications for user' })
  async myNotifications(@Req() request, @Query('limit') limit = '50', @Query('offset') offset = '0') {
    const userId = Number(request.headers.userid || request.query.userId || request.body.userId);
    const lim = Number(limit);
    const off = Number(offset);
    const res = await this.notificationService.getNotificationsForUser(userId, lim, off);
    return { success: true, ...res };
  }

  @Post('mark-read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'JWT token', required: true })
  @ApiBody({ schema: { properties: { notificationId: { type: 'number' } } } })
  @ApiResponse({ status: 200, description: 'Marked as read' })
  async markRead(@Body() body: any, @Req() request) {
    const userId = Number(request.headers.userid || body.userId);
    const notificationId = Number(body.notificationId);
    const ok = await this.notificationService.markAsRead(notificationId, userId);
    return { success: ok };
  }

  @Post('mark-all-read')
  @ApiOperation({ summary: 'Mark all notifications as read for current user' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'JWT token', required: true })
  @ApiResponse({ status: 200, description: 'All marked as read' })
  async markAllRead(@Req() request) {
    const userId = Number(request.headers.userid || request.body.userId || request.query.userId);
    const ok = await this.notificationService.markAllRead(userId);
    return { success: ok };
  }

   @Post('clear-all')
  @ApiOperation({ summary: 'Clear (delete) all notifications for current user' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'JWT token', required: true })
  @ApiResponse({ status: 200, description: 'All cleared' })
  async clearAll(@Req() request) {
    const userId = Number(request.headers.userid || request.body.userId || request.query.userId);
    const ok = await this.notificationService.clearAll(userId);
    return { success: ok };
  }
}
