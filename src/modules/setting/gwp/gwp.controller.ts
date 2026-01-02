import { Body, Controller, Get, Post, Req, Request, UseGuards, } from '@nestjs/common';
import { GwpService } from './gwp.service';
import { VerifyTokenGuard } from '@utils/guards/verify-token/verify-token.guards';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UpdateGhgDataBaseDto } from './dto/update-ghg-Protocol.dto';

@UseGuards(VerifyTokenGuard)
@ApiTags('GWP')
@Controller('v1.0')
export class GwpController {
  constructor(private readonly gwpService: GwpService) { }

  @Get('postLogin/ghg/databases')
  @ApiOperation({ summary: 'Get GWP Data' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Get GWP Data', type: '' })
  databaseVersionList(@Request() request) {
    return this.gwpService.databaseVersionList(request);
  }

  @Get('postLogin/getDataBaseAndVersion')
  @ApiOperation({ summary: 'Get GWP Data' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Get GWP Data', type: '' })
  getDataBaseAndVersion(@Request() request) {
    return this.gwpService.getDataBaseAndVersion(request);
  }  

  @Post('postLogin/ghh/database')
  @ApiOperation({ summary: 'Save ghg Database' })
  @ApiResponse({ status: 200, description: 'Save ghg Database', type: '' })
  UpdateGhgProtocolDto(@Body() updateGhgDataBaseDto: UpdateGhgDataBaseDto, @Req() request) {
    return this.gwpService.updateGhgProtocol(updateGhgDataBaseDto, request);
  }


}
