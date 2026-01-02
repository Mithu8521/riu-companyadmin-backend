import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Query,
  Request,
} from '@nestjs/common';
import { FrameworkService } from './framework.service';
import { CreateFrameworkDto } from './dto/create-framework.dto';
import { VerifyTokenGuard } from '@utils/guards/verify-token/verify-token.guards';
import {
  ApiBearerAuth,
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GetFrameworkDto } from './dto/get-framework.dto';
import { UpdateFrameworkDto } from './dto/update-framework.dto';
import { DeleteFrameworkDto } from './dto/delete-framework.dto';

@UseGuards(VerifyTokenGuard)
@ApiTags('Global Controles : Framework')
@Controller('v1.0')
export class FrameworkController {
  constructor(private readonly frameworkService: FrameworkService) {}

  @Get('postLogin/getCustomFramework')
  @ApiOperation({ summary: 'Get framework' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'token', required: true })
  @ApiResponse({
    status: 200,
    description: 'Get framework',
    type: '',
  })
  getFramework(@Request() request) {
    return this.frameworkService.getFramework(request);
  }

  @Post('postLogin/createCustomFramework')
  @ApiOperation({ summary: 'Create Framework' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'token', required: true })
  @ApiResponse({
    status: 200,
    description: 'Create Framework',
    type: '',
  })
  @ApiBody({ type: CreateFrameworkDto, description: 'api body' })
  createFramework(@Body() body: CreateFrameworkDto, @Request() request) {
    return this.frameworkService.createFramework(body, request);
  }

  @Post('postLogin/updateCustomFramework')
  @ApiOperation({ summary: 'Update Framework' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'token', required: true })
  @ApiResponse({
    status: 200,
    description: 'Update Framework',
    type: '',
  })
  @ApiBody({ type: UpdateFrameworkDto, description: 'api body' })
  updateFramework(
    @Body() updateFrameworkDto: UpdateFrameworkDto,
    @Request() request,
  ) {
    return this.frameworkService.updateFramework(updateFrameworkDto, request);
  }

  @Post('postLogin/deleteCustomFramework')
  @ApiOperation({ summary: 'Delete Framework' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'token', required: true })
  @ApiResponse({
    status: 200,
    description: 'Delete Framework',
    type: '',
  })
  @ApiBody({ type: DeleteFrameworkDto, description: 'api body' })
  deleteFramework(@Body() body: DeleteFrameworkDto, @Request() request) {
    return this.frameworkService.deleteFramework(body, request);
  }
}
