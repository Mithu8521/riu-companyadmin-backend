import { Controller, Get, Post, Body, Req, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { VerifyTokenGuard } from '@utils/guards/verify-token/verify-token.guards';
import { SourceService } from './source.service';
import { CreateSourceDto } from './dto/create-source.dto';
import { UpdateSourceDto } from './dto/update-source.dto';
import { DeleteSourceDto } from './dto/delete-source.dto';
import { CreateSubLocationDto } from './dto/sub-location.dto';

@UseGuards(VerifyTokenGuard)
@ApiTags('Location Management')
@Controller('v1.0')
export class SourceController {
  constructor(private readonly sourceService: SourceService) {}

  @Post('postLogin/createSource')
  @ApiOperation({ summary: 'Create Location' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Create Location', type: '' })
  createSource(@Body() createSourceDto: CreateSourceDto, @Req() request) {
    return this.sourceService.createSource(createSourceDto, request);
  }

  @Post('postLogin/createSubLocation')
  @ApiOperation({ summary: 'Create Sub Location' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Create Sub Location', type: '' })
  createSubLocation(@Body() createSubLocationDto: CreateSubLocationDto, @Req() request) {
    return this.sourceService.createSubLocation(createSubLocationDto, request);
  }

  @Get('postLogin/getSource')
  @ApiOperation({ summary: 'Get Location Data' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Get Location Data', type: '' })
  getSource(@Request() request) {
    return this.sourceService.getSource(request);
  }

  @Post('postLogin/updateSource')
  @ApiOperation({ summary: 'Update Location Data' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Update Location Data', type: '' })
  updateSource(@Body() updateSourceDto: UpdateSourceDto, @Req() request) {
    return this.sourceService.updateSource(updateSourceDto, request);
  }

  @Post('postLogin/deleteSource')
  @ApiOperation({ summary: 'Delete Location Data' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Delete Location Data', type: '' })
  deleteSource(@Body() deleteSourceDto: DeleteSourceDto, @Req() request) {
    return this.sourceService.deleteSource(deleteSourceDto, request);
  }
}
