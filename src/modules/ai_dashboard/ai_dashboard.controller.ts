import { Controller, Get, Post, Body, Param, Delete, UseGuards, Query, Req, Put } from '@nestjs/common';
import { VerifyTokenGuard } from '@utils/guards/verify-token/verify-token.guards';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiTags, ApiQuery, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AiDashboardService } from './ai_dashboard.service';
import { CreatePublishGraphDto } from './dto/create-publish-graph.dto';

@UseGuards(VerifyTokenGuard)
@ApiTags('AI Ganerated Graph')
@Controller('v1.0')
export class AiDashboardController {
  constructor(private readonly aiDashboardService: AiDashboardService ) { }

  @Get('postLogin/genrateGraphData')
  @ApiOperation({ summary: 'Generate Graph Data' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Generate Graph Data' })
  generateGraphData(@Req() request) {
    return this.aiDashboardService.createFromQuery(request);
  }

  @Get('postLogin/graphHistoryData')
  @ApiOperation({ summary: 'History Graph Data' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'History Graph Data' })
  graphHistoryData(@Req() request) {
    return this.aiDashboardService.graphHistoryData(request);
  }

  @Get('postLogin/availableProviders')
  @ApiOperation({ summary: 'Get available Providers' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Get available Providers' })
  availableProviders(@Req() request) {
    return this.aiDashboardService.availableProviders(request);
  }

  @Post('postLogin/synce/graph')
  @ApiOperation({ summary: 'Update graph Data' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'token', required: true })
  @ApiResponse({ status: 200, description: 'Update graph Data' })
  @ApiBody({ description: 'api body' })
  updateDueDate(@Req() request) {
    return this.aiDashboardService.updateGraphData(request);
  }

  @Post('postLogin/publish/graph')
  @ApiOperation({ summary: 'Save publish graph' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Save publish graph' })
  @ApiBody({ description: 'api body' })
  savePublishGraph(@Body() createPublishGraphDto: CreatePublishGraphDto, @Req() request) {
    return this.aiDashboardService.savePublishGraph(createPublishGraphDto, request);
  }

  @Post('postLogin/refreshGraph')
  @ApiOperation({ summary: 'Save publish graph' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Save publish graph' })
  @ApiBody({ description: 'api body' })
  refreshGraph(@Req() request) {
    return this.aiDashboardService.refreshGraph(request);
  }

  @Post('postLogin/graph/feedback')
  @ApiOperation({ summary: 'Save feedback graph' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Save feedback graph' })
  @ApiBody({ description: 'api body' })
  feedback(@Req() request) {
    return this.aiDashboardService.feedback(request);
  }

  @Get('postLogin/publishGraph')
  @ApiOperation({ summary: 'Publish Graph Data' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Publish Graph Data' })
  getPublishGraph(@Req() request) {
    return this.aiDashboardService.getPublishGraph(request);
  }

  @Delete('postLogin/publishGraph')
  @ApiOperation({ summary: 'Soft Delete Published Graph Data' })
  @ApiBearerAuth('authorization')
  @ApiHeader({
    name: 'authorization',
    description: 'Bearer token for authentication',
    required: true
  })
  @ApiResponse({
    status: 200,
    description: 'Marks a published graph as deleted (status = 0)'
  })
  deletePublishGraph(@Req() request) {
    return this.aiDashboardService.deletePublishGraph(request);
  }

}