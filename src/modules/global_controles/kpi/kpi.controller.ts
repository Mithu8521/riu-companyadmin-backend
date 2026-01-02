import { Controller,Get,
  Post,
  Body,
  Request,
  UseGuards,
  Req,

} from '@nestjs/common';
import { KpiService } from './kpi.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateKpiDto } from './dto/create-kpi.dto';
import { DeleteKpiDto } from './dto/delete-kpi.dto';
import { UpdateKpiDto } from './dto/update-kpi.dto';
import { VerifyTokenGuard } from '@utils/guards/verify-token/verify-token.guards';
import { GetKpiDto } from './dto/get-kpi.dto';
@UseGuards(VerifyTokenGuard)
@ApiTags('Global Controles : Kpi')
@Controller('v1.0')
export class KpiController {
  constructor(private readonly kpiService: KpiService) {}

  @Post('postLogin/createCustomKpi')
  @ApiOperation({ summary: 'Create Kpi' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'token', required: true })
  @ApiResponse({
    status: 200,
    description: 'Create Kpi',
    type: '',
  })
  @ApiBody({ type: CreateKpiDto, description: 'api body' })
  createKpi(@Body() body: CreateKpiDto, @Request() request) {
    return this.kpiService.createKpi(body, request);
  }

  @Get('postLogin/getCustomKpiByTopicId')
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
  getKpi( @Req() request) {
    return this.kpiService.getCustomKpiByTopicId( request);
  }

  @Post('postLogin/updateCustomKpi')
  @ApiOperation({ summary: 'Update Kpi' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'token', required: true })
  @ApiResponse({
    status: 200,
    description: 'Update Kpi',
    type: '',
  })
  @ApiBody({ type: UpdateKpiDto, description: 'api body' })
  updateKpi(@Body() updateKpiDto: UpdateKpiDto, @Request() request) {
    return this.kpiService.updateKpi(updateKpiDto, request);
  }

  @Post('postLogin/deleteCustomKpi')
  @ApiOperation({ summary: 'Delete Kpi' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'token', required: true })
  @ApiResponse({
    status: 200,
    description: 'Delete Kpi',
    type: '',
  })
  @ApiBody({ type: DeleteKpiDto, description: 'api body' })
  deleteKpi(@Body() body: DeleteKpiDto, @Request() request) {
    return this.kpiService.deleteKpi(body, request);
  }
}
