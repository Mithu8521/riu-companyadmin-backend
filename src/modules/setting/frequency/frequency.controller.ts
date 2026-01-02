import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { FrequencyService } from './frequency.service';
import { VerifyTokenGuard } from '@utils/guards/verify-token/verify-token.guards';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UpdateFrequencyDto } from './dto/create-frequency.dto';

@UseGuards(VerifyTokenGuard)
@ApiTags('Frequency Management')
@Controller('v1.0')
export class FrequencyController {
  constructor(private readonly frequencyService: FrequencyService) {}

  @Post('postLogin/saveFrequencyModule')
  @ApiOperation({ summary: 'Save Frequency Module' })
  @ApiResponse({ status: 200, description: 'Save Frequency Module', type: '' })
  createProcess(@Body() updateFrequencyDto: UpdateFrequencyDto, @Req() request) {
    return this.frequencyService.saveFrequencyModule(updateFrequencyDto, request);
  }

  @Get('postLogin/getFrequency')
  @ApiOperation({ summary: 'Get Frequency Module' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Get Frequency Module', type: '' })
  getFrequency(@Req() request) {
    return this.frequencyService.getFrequency(request);
  }

  @Get('postLogin/getFrequencyModule')
  @ApiOperation({ summary: 'Get Frequency Module' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Get Frequency Module', type: '' })
  getProcess(@Req() request) {
    return this.frequencyService.getFrequencyModule(request);
  }
}
