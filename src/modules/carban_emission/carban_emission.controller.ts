import { Controller, Get, UseGuards, Request, Req, Post, Body } from '@nestjs/common';
import { CarbanEmissionService } from './carban_emission.service';
import { VerifyTokenGuard } from '@utils/guards/verify-token/verify-token.guards';
import { ApiBearerAuth, ApiBody, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FuelConsumptionDto } from './dto/create-carban_emission.dto';
import { SaveEmissionCalculationDto } from './dto/save-carbon_emission.dto';
import { SaveEmissionScope2CalculationDto } from './dto/save-carbon_emission_scope2.dto';

@UseGuards(VerifyTokenGuard)
@ApiTags('Emission Management')
@Controller('v1.0')
export class CarbanEmissionController {
  constructor(private readonly carbanEmissionService: CarbanEmissionService) { }
  @Get('postLogin/ghg/databases/conversionFactors')
  @ApiOperation({ summary: 'Get GHG DataBase' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Get GHG DataBase', type: '' })
  getGHGDataBase(@Request() request) {
    return this.carbanEmissionService.getGHGDataBase(request);
  }

  @Get('postLogin/getCarbonFootPrintingData')
  @ApiOperation({ summary: 'Get Carbon Foot Printing Data' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Get Carbon Foot Printing Data', type: '' })
  getCarbonFootPrintingData(@Request() request) {
    return this.carbanEmissionService.getCarbonFootPrintingData(request);
  }

  @Get('postLogin/ghg/scope/emissions')
  @ApiOperation({ summary: 'Get Scope1 Emission Data' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Get Scope1 Emission Data', type: '' })
  getScope1EmissionsData(@Request() request) {
    return this.carbanEmissionService.getScopeEmissionData(request);
  }

  @Get('postLogin/ghg/scope3/categories')
  @ApiOperation({ summary: 'Get Scope3 Categories' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Get Scope3 Categories', type: '' })
  getScope3Categories(@Request() request) {
    return this.carbanEmissionService.getScope3Categories(request);
  }

  @Post('postLogin/calculateEmission')
  @ApiOperation({ summary: 'calculation of emission' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'token', required: true })
  @ApiResponse({ status: 200, description: 'calculation of emission' })
  @ApiBody({ type: FuelConsumptionDto, description: 'api body' })
  calculateEmission(@Body() body: FuelConsumptionDto, @Req() request) {
    return this.carbanEmissionService.calculateEmission(body, request);
  }

  @Post('postLogin/ghg/scope/emissions')
  @ApiOperation({ summary: 'calculation of emission' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'token', required: true })
  @ApiResponse({ status: 200, description: 'calculation of emission' })
  @ApiBody({ type: SaveEmissionCalculationDto, description: 'api body' })
  saveEmissionCalculation(@Body() body: SaveEmissionCalculationDto, @Req() request) {
    return this.carbanEmissionService.saveEmissionCalculation(body, request);
  }
}
