import { Controller, Get, UseGuards, Request, Post, Body, Req } from '@nestjs/common';
import { EmissionService } from './emission.service';
import { ApiBearerAuth, ApiBody, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { VerifyTokenGuard } from '@utils/guards/verify-token/verify-token.guards';
import { CreateEmissionQuestionDto } from './dto/create-emission.dto';

@UseGuards(VerifyTokenGuard)
@ApiTags('Emission Management')
@Controller('v1.0')
export class EmissionController {
  constructor(private readonly emissionService: EmissionService) {}

  @Get('postLogin/getEmission')
  @ApiOperation({ summary: 'Get Process Data' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Get Emission Data', type: '' })
  getProcess(@Request() request) {
    return this.emissionService.getEmissionFactor(request);
  }

  @Get('postLogin/getEmissionCalculation')
  @ApiOperation({ summary: 'Get Process Data' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Get Emission Data', type: '' })
  getEmissionCalculation(@Request() request) {
    return this.emissionService.getEmissionCalculation(request);
  }

  @Post('postLogin/saveEmissionQuestion')
  @ApiOperation({ summary: 'Save Set Emission Question' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'token', required: true })
  @ApiResponse({ status: 200, description: 'Save Set Emission Question' })
  @ApiBody({ type: CreateEmissionQuestionDto, description: 'api body' })
  saveSetTargetQuestion(@Body() body: CreateEmissionQuestionDto, @Req() request) {
    return this.emissionService.saveEmissionQuestion(body, request);
  }

  
}
