import { Body, Controller, Get, Post, Req, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SaveUnitCatagoryDto } from './dto/create-unit.dto';
import { UnitService } from './unit.service';
import { VerifyTokenGuard } from '@utils/guards/verify-token/verify-token.guards';
@UseGuards(VerifyTokenGuard)
@ApiTags('Unit Module')
@Controller('v1.0')
export class UnitController {
  constructor(private readonly unitService: UnitService) { }

  @Get('postLogin/getUnitCatagory')
  @ApiOperation({ summary: 'Get Unit Catagory' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Get Unit Catagory', type: '' })
  getUnitCatagory(@Request() request) {
    return this.unitService.getUnitCatagory(request);
  }

  @Get('postLogin/getUnit')
  @ApiOperation({ summary: 'Get Unit Catagory' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Get Unit Catagory', type: '' })
  getUnit(@Request() request) {
    return this.unitService.getUnit(request);
  }

  @Post('postLogin/saveUnitCatagory')
  @ApiOperation({ summary: 'Save Unit' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'token', required: true })
  @ApiResponse({ status: 200, description: 'Save Unit' })
  @ApiBody({ type: SaveUnitCatagoryDto, description: 'api body' })
  saveUnitCatagory(@Body() body: SaveUnitCatagoryDto, @Req() request) {
    return this.unitService.saveUnitCatagory(body, request);
  }

}

