import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards, } from '@nestjs/common';
import { VerifyTokenGuard } from '@utils/guards/verify-token/verify-token.guards';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CustomGraphService } from './custom_dashboard.service';

@UseGuards(VerifyTokenGuard)
@ApiTags('BI Dashboard')
@ApiBearerAuth('authorization')
@ApiHeader({ name: 'authorization', description: 'token', required: true })
@Controller('v1.0/postLogin')
export class CustomGraphController {
  constructor(private readonly biGraphService: CustomGraphService) { }

  @Get('dashboard/data-sources')
  @ApiOperation({ summary: 'Get all data sources' })
  @ApiResponse({ status: 200, description: 'Get all data sources' })
  getAllDataSources(@Req() request) {
    return this.biGraphService.getAllDataSources(request);
  }

  @Post('bi-graph')
  @ApiOperation({ summary: 'Create BI Graph' })
  @ApiResponse({ status: 201, description: 'Graph created' })
  createGraph(@Req() request, @Body() body) {
    return this.biGraphService.create(request, body);
  }

  @Get('bi-graphs')
  @ApiOperation({ summary: 'Get all graphs' })
  @ApiResponse({ status: 200, description: 'List of graphs' })
  getAllGraphs(@Req() request, @Param('dashboardId') dashboardId?: number) {
    return this.biGraphService.findAll(request, dashboardId);
  }

  @Get('bi-graph/filters')
  @ApiOperation({ summary: 'Get filter options for BI graphs' })
  @ApiResponse({ status: 200, description: 'Filter options' })
  getFilterOptions(@Req() request) {
    return this.biGraphService.getFilterOptions(request);
  }

  @Get('bi-graph/:id')
  @ApiOperation({ summary: 'Get graph by ID' })
  @ApiResponse({ status: 200, description: 'Graph details' })
  getGraph(@Req() request, @Param('id') id: number) {
    return this.biGraphService.getGraphData(id, request);
  }

  @Get('bi-graph/:id/data')
  @ApiOperation({ summary: 'Get graph data' })
  @ApiResponse({ status: 200, description: 'Graph data' })
  getGraphData(@Req() request, @Param('id') id: number) {
    return this.biGraphService.getGraphData(id, request);
  }

  @Post('bi-graph/:id/sync')
  @ApiOperation({ summary: 'Sync graph data' })
  @ApiResponse({ status: 200, description: 'Graph synced' })
  syncGraph(@Req() request, @Param('id') id: number) {
    return this.biGraphService.refreshGraph(id, request);
  }

  @Put('bi-graph/:id')
  @ApiOperation({ summary: 'Update graph' })
  @ApiResponse({ status: 200, description: 'Graph updated' })
  updateGraph(@Req() request, @Param('id') id: number, @Body() body) {
    return this.biGraphService.update(id, request, body);
  }

  @Delete('bi-graph/:id')
  @ApiOperation({ summary: 'Delete graph' })
  @ApiResponse({ status: 200, description: 'Graph deleted' })
  deleteGraph(@Req() request, @Param('id') id: number) {
    return this.biGraphService.delete(id, request);
  }

  @Post('bi-graphs/reorder')
  @ApiOperation({ summary: 'Reorder graphs' })
  @ApiResponse({ status: 200, description: 'Graphs reordered' })
  reorderGraphs(@Req() request, @Body() body) {
    return this.biGraphService.reorderGraphs(request, body);
  }

  @Post('bi-graph/:id/publish')
  @ApiOperation({ summary: 'Publish graph' })
  @ApiResponse({ status: 200, description: 'Graph published successfully' })
  @ApiResponse({ status: 404, description: 'Graph not found' })
  publishGraph(@Req() request, @Param('id') id: number) {
    return this.biGraphService.publishGraph(id, request);
  }
}