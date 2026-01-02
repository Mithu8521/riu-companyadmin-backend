import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { VerifyTokenGuard } from '@utils/guards/verify-token/verify-token.guards';
import { OrgChartService } from './org_chart.service';
import { CreateOrgChartDto } from './dto/create-org_chart.dto';

@UseGuards(VerifyTokenGuard)
@ApiTags('Org-Chart Management')
@Controller('v1.0')
export class OrgChartController {
  constructor(private readonly orgChartService: OrgChartService) {}

  @Post('postLogin/createOrgChart')
  @ApiOperation({ summary: 'Create Org Chart' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'token', required: true })
  @ApiResponse({ status: 200, description: 'Create Org Chart', type: '' })
  @ApiBody({ type: CreateOrgChartDto, description: 'api body' })
  createOrgChart(@Body() body: CreateOrgChartDto, @Req() request) {
    return this.orgChartService.createOrgChart(body, request);
  }

  @Get('postLogin/getOrgChart')
  @ApiOperation({ summary: 'Get Org Chart' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Get Org Chart', type: '' })
  getOrgChart(@Req() request) {
    return this.orgChartService.getOrgChart(request);
  }
}
