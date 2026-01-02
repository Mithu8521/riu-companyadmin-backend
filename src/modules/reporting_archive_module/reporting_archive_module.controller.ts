
import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ReportingArchiveModuleService } from './reporting_archive_module.service';
import { SaveReportingArchiveModuleDto } from './dto/create-reporting_archive_module.dto';

@ApiTags('Reporting Question Answer Module')
@Controller('v1.0')
export class ReportingArchiveModuleController {
  constructor(private readonly reportingArchiveModuleService: ReportingArchiveModuleService) {}

  @Post('postLogin/saveArchiveAnswerReporting')
  @ApiOperation({ summary: 'Save Answer Reporting Question' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'token', required: true })
  @ApiResponse({ status: 200, description: 'Save Answer Sector Question' })
  @ApiBody({ type: SaveReportingArchiveModuleDto, description: 'api body' })
  saveArchiveAnswerReporting(@Body() body: SaveReportingArchiveModuleDto, @Req() request) {
    return this.reportingArchiveModuleService.saveArchiveAnswerReporting(body, request);
  }

  @Get('postLogin/getReportingArchiveAnswer')
  @ApiOperation({ summary: 'Get Reporting Answer' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Get Reporting Answer' })
  getReportingArchiveAnswer(@Req() request) {
    return this.reportingArchiveModuleService.getReportingArchiveAnswer(request);
  }
}
