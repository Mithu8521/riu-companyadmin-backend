import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { IntensityService } from './intensity.service';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { VerifyTokenGuard } from '@utils/guards/verify-token/verify-token.guards';
import { GetIntensityDto } from './dto/get-intensity.dto';
import { SaveIntensityDto } from './dto/save-intensity.dto';
import { IntensityDto } from './dto/intensity.dto';


@UseGuards(VerifyTokenGuard)
@ApiTags('Intensity')
@Controller('v1.0')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class IntensityController {
  constructor(private readonly intensityService: IntensityService) {}

  @Get('postLogin/intensity')
  @ApiOperation({ summary: 'Get Intensity' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Get Intensity' })
  async getIntensity(@Req() request, @Query() queryParams: GetIntensityDto)
    : Promise<IntensityDto[]> {
    return await this.intensityService.getIntensity(request, queryParams);
  }
  
  @Get('postLogin/intensity/questions')
  @ApiOperation({ summary: 'Get Intensity' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Get Intensity' })
  getIntensityQuestions(@Req() request) {
    return this.intensityService.getIntensityQuestions(request);
  }


  @Post('postLogin/intensity')
  @ApiOperation({ summary: 'Save Intensity' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Save Intensity' })
  saveIntensity(@Req() request, @Body() body: {intensity: SaveIntensityDto[]}) {
    return this.intensityService.saveIntensity(request, body);
  }
}
