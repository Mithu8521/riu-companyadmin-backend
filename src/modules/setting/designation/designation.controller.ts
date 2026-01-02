import { Controller, Get, Post, Body, Req, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { VerifyTokenGuard } from '@utils/guards/verify-token/verify-token.guards';
import { DesignationService } from './designation.service';
import { CreateDesignationDto } from './dto/create-designation.dto';
import { UpdateDesignationDto } from './dto/update-designation.dto';
import { DeleteDesignationDto } from './dto/delete-desigantion.dto';

@UseGuards(VerifyTokenGuard)
@ApiTags('Designation Management')
@Controller('v1.0')
export class DesignationController {
  constructor(private readonly designationService: DesignationService) { }

  @Post('postLogin/createDesignation')
  @ApiOperation({ summary: 'Create Designation' })
  @ApiResponse({ status: 200, description: 'Create Designation', type: '' })
  createDesignation(@Body() createDesignationDto: CreateDesignationDto, @Req() request) {
    return this.designationService.createDesignation(createDesignationDto, request);
  }

  @Get('postLogin/getDesignation')
  @ApiOperation({ summary: 'Get Designation Data' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Get Designation Data', type: '' })
  getDesignation(@Request() request) {
    return this.designationService.getDesignation(request);
  }

  @Post('postLogin/updateDesignation')
  @ApiOperation({ summary: 'Update Designation Data' })
  @ApiResponse({ status: 200, description: 'Update Designation Data', type: '' })
  updateDesignation(@Body() updateDesignationDto: UpdateDesignationDto, @Req() request) {
    return this.designationService.updateDesignation(updateDesignationDto, request);
  }

  @Post('postLogin/deleteDesignation')
  @ApiOperation({ summary: 'Delete Designation Data' })
  @ApiResponse({ status: 200, description: 'Delete Designation Data', type: '' })
  deleteDesignation(@Body() deleteDesignationDto: DeleteDesignationDto, @Req() request) {
    return this.designationService.deleteDesignation(deleteDesignationDto, request);
  }
}
