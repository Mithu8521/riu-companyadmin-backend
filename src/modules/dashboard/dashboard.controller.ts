import { Body, Controller, Get, Post, Req, Request, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { VerifyTokenGuard } from '@utils/guards/verify-token/verify-token.guards';
import { FilterGraphDto } from './dto/graph-filter.dto';

@UseGuards(VerifyTokenGuard)
@ApiTags('Dashboard Graph Apis')
@Controller('v1.0')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) { }

  @Get('postLogin/lastWeekActivity')
  @ApiOperation({ summary: 'Get last week activity' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'token', required: true })
  @ApiResponse({
    status: 200,
    description: 'Get last week activity',
    type: '',
  })
  lastWeekActivity(@Request() request) {
    return this.dashboardService.lastWeekActivity(request);
  }

  // @Get('postLogin/dashbord/progress/summary')
  // @ApiOperation({ summary: 'Get progress summary' })
  // @ApiBearerAuth('authorization')
  // @ApiHeader({ name: 'authorization', description: 'token', required: true })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Get progress summary',
  //   type: '',
  // })
  // getProgressSummary(@Request() request) {
  //   return this.dashboardService.getProgressSummary(request);
  // }

  @Get('postLogin/todaysActivity')
  @ApiOperation({ summary: 'Get today activity' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'token', required: true })
  @ApiResponse({
    status: 200,
    description: 'Get today activity',
    type: '',
  })
  todaysActivity(@Request() request) {
    return this.dashboardService.todaysActivity(request);
  }

  @Get('postLogin/dashbord/allUsers')
  @ApiOperation({ summary: 'Get all user' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'token', required: true })
  @ApiResponse({
    status: 200,
    description: 'Get all user',
    type: '',
  })
  allUsers(@Request() request) {
    return this.dashboardService.allUsers(request);
  }

  @Get('postLogin/overAllStatusOverview')
  @ApiOperation({ summary: 'Over All Status Overview' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'token', required: true })
  @ApiResponse({
    status: 200,
    description: 'Over All Status Overview',
    type: '',
  })
  overAllStatusOverview(@Request() request) {
    return this.dashboardService.overAllStatusOverview(request);
  }

  @Get('postLogin/teamWorkloadProgess')
  @ApiOperation({ summary: 'Team Workload Progess' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'token', required: true })
  @ApiResponse({
    status: 200,
    description: 'Team Workload Progess',
    type: '',
  })
  teamWorkloadProgess(@Request() request) {
    return this.dashboardService.teamWorkloadProgess(request);
  }

  @Get('postLogin/myAuditWorkloadProgess')
  @ApiOperation({ summary: 'My Audit Workload Progess' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'token', required: true })
  @ApiResponse({
    status: 200,
    description: 'My Audit Workload Progess',
    type: '',
  })
  myAuditWorkloadProgess(@Request() request) {
    return this.dashboardService.myAuditWorkloadProgess(request);
  }

  @Get('postLogin/myAssignedQuestionWorkloadProgess')
  @ApiOperation({ summary: 'My Assigned Workload Progess' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'token', required: true })
  @ApiResponse({
    status: 200,
    description: 'My Assigned Workload Progess',
    type: '',
  })
  myAssignedWorkloadProgess(@Request() request) {
    return this.dashboardService.myAssignedWorkloadProgess(request);
  }


  @Get('postLogin/myDisclosureProgress')
  @ApiOperation({ summary: 'My Disclosure Progress' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'token', required: true })
  @ApiResponse({
    status: 200,
    description: 'My Disclosure Progress',
    type: '',
  })
  myDisclosureProgress(@Request() request) {
    return this.dashboardService.myDisclosureProgress(request);
  }

  @Get('postLogin/frameworkProgress')
  @ApiOperation({ summary: 'Framework Progress' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'token', required: true })
  @ApiResponse({
    status: 200,
    description: 'Framework Progress',
    type: '',
  })
  frameworkProgress(@Request() request) {
    return this.dashboardService.frameworkProgress(request);
  }

  @Get('postLogin/sourceProgress')
  @ApiOperation({ summary: 'Source Progress' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'token', required: true })
  @ApiResponse({
    status: 200,
    description: 'Source Progress',
    type: '',
  })
  sourceProgress(@Request() request) {
    return this.dashboardService.sourceProgress(request);
  }

  @Get('postLogin/getTotalTrainingData')
  @ApiOperation({ summary: 'Question Scopes Progress' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'token', required: true })
  @ApiResponse({
    status: 200,
    description: 'Question Scopes Progress',
    type: '',
  })
  getTotalTrainingData(@Request() request) {
    return this.dashboardService.getTotalTrainingData(request);
  }

  @Get('postLogin/getTriggerEnvironmentData')
  @ApiOperation({ summary: 'Question Scopes Progress' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'token', required: true })
  @ApiResponse({
    status: 200,
    description: 'Question Scopes Progress',
    type: '',
  })
  getTriggerEnvironmentData(@Request() request) {
    return this.dashboardService.getTriggerEnvironmentData(request);
  }

  @Get('postLogin/getCompareEnergyData')
  @ApiOperation({ summary: 'Question Scopes Progress' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'token', required: true })
  @ApiResponse({
    status: 200,
    description: 'Question Scopes Progress',
    type: '',
  })
  getCompareEnergyData(@Request() request) {
    return this.dashboardService.getCompareEnergyData(request);
  }

  @Get('postLogin/getCompareWaterData')
  @ApiOperation({ summary: 'Question Scopes Progress' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'token', required: true })
  @ApiResponse({
    status: 200,
    description: 'Question Scopes Progress',
    type: '',
  })
  getCompareWaterData(@Request() request) {
    return this.dashboardService.getCompareWaterData(request);
  }

  @Get('postLogin/getCompareWasteData')
  @ApiOperation({ summary: 'Question Scopes Progress' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'token', required: true })
  @ApiResponse({
    status: 200,
    description: 'Question Scopes Progress',
    type: '',
  })
  getCompareWasteData(@Request() request) {
    return this.dashboardService.getCompareWasteData(request);
  }

  @Get('postLogin/getCompareDiversityData')
  @ApiOperation({ summary: 'Question Scopes Progress' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'token', required: true })
  @ApiResponse({
    status: 200,
    description: 'Question Scopes Progress',
    type: '',
  })
  getCompareDiversityData(@Request() request) {
    return this.dashboardService.getCompareDiversityData(request);
  }

  @Get('postLogin/getCompareTrainingData')
  @ApiOperation({ summary: 'Question Scopes Progress' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'token', required: true })
  @ApiResponse({
    status: 200,
    description: 'Question Scopes Progress',
    type: '',
  })
  getCompareTrainingData(@Request() request) {
    return this.dashboardService.getCompareTrainingData(request);
  }

  @Get('postLogin/getCompareSafetyData')
  @ApiOperation({ summary: 'Question Scopes Progress' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'token', required: true })
  @ApiResponse({
    status: 200,
    description: 'Question Scopes Progress',
    type: '',
  })
  getCompareSafetyData(@Request() request) {
    return this.dashboardService.getCompareSafetyData(request);
  }

  @Get('postLogin/getCompareCustomerComplaintsData')
  @ApiOperation({ summary: 'Question Scopes Progress' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'token', required: true })
  @ApiResponse({
    status: 200,
    description: 'Question Scopes Progress',
    type: '',
  })
  getCompareCustomerComplaintsData(@Request() request) {
    return this.dashboardService.getCompareCustomerComplaintsData(request);
  }

  @Get('postLogin/getTurnOverRate')
  @ApiOperation({ summary: 'Question Scopes Progress' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'token', required: true })
  @ApiResponse({
    status: 200,
    description: 'Question Scopes Progress',
    type: '',
  })
  getTurnOverRate(@Request() request) {
    return this.dashboardService.getTurnOverRate(request);
  }

  @Post('postLogin/saveGraphFilter')
  @ApiOperation({ summary: 'Save Graph Filter' })
  @ApiBearerAuth('authorization')
  @ApiHeader({
    name: 'authorization',
    description: 'Is authorization',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Save Graph Filter',
    type: '',
  })
  saveGraphFilter(@Body() filterGraphDto: FilterGraphDto, @Req() request) {
    return this.dashboardService.saveGraphFilter(filterGraphDto, request);
  }

  @Get('postLogin/getEnergyEmissionComparison')
  @ApiOperation({ summary: 'Question Energy Progress' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'token', required: true })
  @ApiResponse({
    status: 200,
    description: 'Question Energy Progress',
    type: '',
  })
  getEnergyEmissionComparison(@Request() request) {
    return this.dashboardService.getEnergyEmissionComparison(request);
  }

  @Get('postLogin/getUserProgressData')
  @ApiOperation({ summary: 'Question Energy Progress' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'token', required: true })
  @ApiResponse({
    status: 200,
    description: 'Question Energy Progress',
    type: '',
  })
  getUserProgressData(@Request() request) {
    return this.dashboardService.getUserProgressData(request);
  }

  @Get('postLogin/getAllTrainingDataForGraphForUser')
  @ApiOperation({ summary: 'Training Progress' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'token', required: true })
  @ApiResponse({
    status: 200,
    description: 'Training Progress',
    type: '',
  })
  getAllTrainingDataForGraphForUser(@Request() request) {
    return this.dashboardService.getAllTrainingDataForGraphForUser(request);
  }

  @Get('postLogin/getAllTrainingDataForGraphForTrainer')
  @ApiOperation({ summary: 'Training Progress' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'token', required: true })
  @ApiResponse({
    status: 200,
    description: 'Training Progress',
    type: '',
  })
  getAllTrainingDataForGraphForTrainer(@Request() request) {
    return this.dashboardService.getAllTrainingDataForGraphForTrainer(request);
  }

  @Get('postLogin/getBiomedicalData')
  @ApiOperation({ summary: 'Biomedical Data' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'token', required: true })
  @ApiResponse({
    status: 200,
    description: 'Biomedical Data',
    type: '',
  })
  getBiomedicalData(@Request() request) {
    return this.dashboardService.getBiomedicalData(request);
  }

  @Get('postLogin/getWaterData')
  @ApiOperation({ summary: 'Water Data' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'token', required: true })
  @ApiResponse({
    status: 200,
    description: 'Water Data',
    type: '',
  })
  getWaterData(@Request() request) {
    return this.dashboardService.getWaterData(request);
  }  

  @Get('postLogin/getPermissionGraphWithAssignedQuestions')
  @ApiOperation({ summary: 'Question Energy Progress' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'token', required: true })
  @ApiResponse({
    status: 200,
    description: 'Question Energy Progress',
    type: '',
  })
  getPermissionGraphWithAssignedQuestions(@Request() request) {
    return this.dashboardService.getPermissionGraphWithAssignedQuestions(request);
  }

  @Get('postLogin/getEnvironmentData')
  @ApiOperation({ summary: 'Question Energy Progress' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'token', required: true })
  @ApiResponse({
    status: 200,
    description: 'Question Energy Progress',
    type: '',
  })
  getEnvironmentData(@Request() request) {
    return this.dashboardService.getEnvironmentData(request);
  }


}
