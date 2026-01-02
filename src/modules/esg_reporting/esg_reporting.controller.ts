import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { VerifyTokenGuard } from '@utils/guards/verify-token/verify-token.guards';
import { EsgReportingService } from './esg_reporting.service';
import { CreateEsgReportingDto } from './dto/create-esg_reporting.dto';

@UseGuards(VerifyTokenGuard)
@ApiTags('ESG Reporting Module')
@Controller('v1.0')
export class EsgReportingController {
  constructor(private readonly esgReportingService: EsgReportingService) {}

  @Get('postLogin/getFinancialYear')
  @ApiOperation({ summary: 'Get Financial Year' })
  @ApiBearerAuth('authorization')
  @ApiHeader({
    name: 'authorization',
    description: 'Is authorization',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Get Financial Year',
    type: '',
  })
  getFinancialYear(@Req() request) {
    return this.esgReportingService.getFinancialYear(request);
  }

  @Get('postLogin/getFramework')
  @ApiOperation({ summary: 'Get Framework' })
  @ApiBearerAuth('authorization')
  @ApiHeader({
    name: 'authorization',
    description: 'Is authorization',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Get Framework',
    type: '',
  })
  getFramework(@Request() request) {
    return this.esgReportingService.getFramework(request);
  }

  @Get('postLogin/getTopic')
  @ApiOperation({ summary: 'Get Topic' })
  @ApiBearerAuth('authorization')
  @ApiHeader({
    name: 'authorization',
    description: 'Is authorization',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Get Topic',
    type: '',
  })
  getTopic(@Request() request) {
    return this.esgReportingService.getTopic(request);
  }

  @Get('postLogin/getKpi')
  @ApiOperation({ summary: 'Get Kpi' })
  @ApiBearerAuth('authorization')
  @ApiHeader({
    name: 'authorization',
    description: 'Is authorization',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Get Kpi',
    type: '',
  })
  getKpi(@Request() request) {
    return this.esgReportingService.getKpi(request);
  }

  @Get('postLogin/getESGReport')
  @ApiOperation({ summary: 'Get ESG Report' })
  @ApiBearerAuth('authorization')
  @ApiHeader({
    name: 'authorization',
    description: 'Is authorization',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Get ESG Report',
    type: '',
  })
  getESGReport(@Request() request) {
    return this.esgReportingService.getESGReport(request);
  }

  @Post('postLogin/saveESGReport')
  @ApiOperation({ summary: 'Save ESG Report' })
  @ApiBearerAuth('authorization')
  @ApiHeader({
    name: 'authorization',
    description: 'Is authorization',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Save ESG Report',
    type: '',
  })
  saveESGReport(@Body() createEsgReportingDto: CreateEsgReportingDto, @Req() request) {
    return this.esgReportingService.saveESGReport(createEsgReportingDto,request);
  }
}
