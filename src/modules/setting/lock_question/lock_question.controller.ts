import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { LockQuestionService } from './lock_question.service';
import { LockPeriodDto } from './dto/lock-period.dto';
import { UnlockPeriodDto } from './dto/unlock-period.dto';
import { GetLockedPeriodsDto } from './dto/get-locked-periods.dto';
import { VerifyTokenGuard } from '@utils/guards/verify-token/verify-token.guards';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth, ApiHeader, ApiQuery } from '@nestjs/swagger';

@UseGuards(VerifyTokenGuard)
@ApiTags('lock-question')
@Controller('v1.0')
export class LockQuestionController {
  constructor(private readonly lockQuestionService: LockQuestionService) {}

  @Post('postLogin/periods/lock')
  @ApiOperation({ summary: 'Lock questions for a specific period' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Authorization token', required: true })
  @ApiResponse({ status: 200, description: 'Period locked successfully', type: '' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async lockPeriod(@Body() lockPeriodDto: LockPeriodDto, @Req() request) {
    return await this.lockQuestionService.lockPeriod(lockPeriodDto, request);
  }

  @Get('postLogin/periods/locked')
  @ApiOperation({ summary: 'Get all locked periods' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Authorization token', required: true })
  @ApiQuery({ name: 'financialYearId', required: true, type: Number })
  @ApiQuery({ name: 'frequency', required: true, type: String })
  @ApiResponse({ status: 200, description: 'Locked periods retrieved successfully', type: '' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getLockedPeriods(@Query() query: GetLockedPeriodsDto, @Req() request) {
    return await this.lockQuestionService.getLockedPeriods(query, request);
  }




}

