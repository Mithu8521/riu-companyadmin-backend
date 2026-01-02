import { Controller, Get, Post, Body, Req, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { VerifyTokenGuard } from '@utils/guards/verify-token/verify-token.guards';
import { ProcessService } from './process.service';
import { CreateProcessDto } from './dto/create-process.dto';
import { UpdateProcessDto } from './dto/update-process.dto';
import { DeleteProcessDto } from './dto/delete-process.dto';

@UseGuards(VerifyTokenGuard)
@ApiTags('Process Management')
@Controller('v1.0')
export class ProcessController {
  constructor(private readonly processService: ProcessService) {}

  @Post('postLogin/createProcess')
  @ApiOperation({ summary: 'Create Process' })
  @ApiResponse({ status: 200, description: 'Create Process', type: '' })
  createProcess(@Body() createProcessDto: CreateProcessDto, @Req() request) {
    return this.processService.createProcess(createProcessDto, request);
  }

  @Get('postLogin/getProcess')
  @ApiOperation({ summary: 'Get Process Data' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Get Process Data', type: '' })
  getProcess(@Request() request) {
    return this.processService.getProcess(request);
  }

  @Post('postLogin/updateProcess')
  @ApiOperation({ summary: 'Update Process Data' })
  @ApiResponse({ status: 200, description: 'Update Process Data', type: '' })
  updateProcess(@Body() updateProcessDto: UpdateProcessDto, @Req() request) {
    return this.processService.updateProcess(updateProcessDto, request);
  }

  @Post('postLogin/deleteProcess')
  @ApiOperation({ summary: 'Delete Process Data' })
  @ApiResponse({ status: 200, description: 'Delete Process Data', type: '' })
  deleteProcess(@Body() deleteProcessDto: DeleteProcessDto, @Req() request) {
    return this.processService.deleteProcess(deleteProcessDto, request);
  }
}
