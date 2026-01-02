import { Controller, Get, Post, Body, Patch, Param, Delete, Req } from '@nestjs/common';
import { SetTargetDataQuestionService } from './set_target_data_question.service';
import { CreateSetTargetDataQuestionDto } from './dto/create-set_target_data_question.dto';
import { ApiBearerAuth, ApiBody, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Set Target Data Question')
@Controller('v1.0')
export class SetTargetDataQuestionController {
  constructor(private readonly setTargetDataQuestionService: SetTargetDataQuestionService) {}

  @Get('postLogin/getSetTargetQuestion')
  @ApiOperation({ summary: 'Set Target Question' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Set Target Question' })
  getSetTargetQuestion(@Req() request) {
    return this.setTargetDataQuestionService.getSetTargetQuestion(request);
  }

  @Get('postLogin/getTargetQuestionAnswer')
  @ApiOperation({ summary: 'Get Target Answer' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Get Target Answer' })
  getTargetQuestionAnswer(@Req() request) {
    return this.setTargetDataQuestionService.getTargetQuestionAnswer(request);
  }  

  @Post('postLogin/saveSetTargetQuestion')
  @ApiOperation({ summary: 'Save Set Target Question' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'token', required: true })
  @ApiResponse({ status: 200, description: 'Save Set Target Question' })
  @ApiBody({ type: CreateSetTargetDataQuestionDto, description: 'api body' })
  saveSetTargetQuestion(@Body() body: CreateSetTargetDataQuestionDto, @Req() request) {
    return this.setTargetDataQuestionService.saveSetTargetQuestion(body, request);
  }

  @Post('postLogin/saveTriggerData')
  @ApiOperation({ summary: 'Save Set Target Question' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'token', required: true })
  @ApiResponse({ status: 200, description: 'Save Set Target Question' })
  @ApiBody({ type: CreateSetTargetDataQuestionDto, description: 'api body' })
  saveTriggerData(@Body() body: CreateSetTargetDataQuestionDto, @Req() request) {
    return this.setTargetDataQuestionService.saveTriggerData(body, request);
  }

  @Get('postLogin/getTargerAnswer')
  @ApiOperation({ summary: 'Get Target Answer' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Get Target Answer' })
  getTargerAnswer(@Req() request) {
    return this.setTargetDataQuestionService.getTargerAnswer(request);
  }

  @Get('postLogin/getTriggerValues')
  @ApiOperation({ summary: 'Get Target Answer' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Get Target Answer' })
  getTriggerValues(@Req() request) {
    return this.setTargetDataQuestionService.getTriggerValues(request);
  }  
  


}
