import { Controller, Get, Post, Body, Req, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { VerifyTokenGuard } from '@utils/guards/verify-token/verify-token.guards';
import { SubUserService } from './sub-user.service';
import { CreateSubUserDto } from './dto/create-sub-user.dto';

@UseGuards(VerifyTokenGuard)
@ApiTags('Sub User Management')
@Controller('v1.0')
export class SubUserController {
  constructor(private readonly subUserService: SubUserService) {}

  @Get('postLogin/getSubUser')
  @ApiOperation({ summary: 'Get Sub User Data' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Get Sub User Data', type: '' })
  getSubUser(@Request() request) {
    return this.subUserService.getSubUser(request);
  }

  @Get('postLogin/getAllUser')
  @ApiOperation({ summary: 'Get Sub User Data' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Get Sub User Data', type: '' })
  getAllUser(@Request() request) {
    return this.subUserService.getAllUser(request);
  }

  @Post('postLogin/inviteSubUser')
  @ApiOperation({ summary: 'Invite Sub User' })
  @ApiResponse({ status: 200, description: 'Invite Sub User', type: '' })
  inviteSubUser(@Body() createSubUserDto: CreateSubUserDto, @Request() request) {
    return this.subUserService.inviteSubUser(createSubUserDto, request);
  }

  @Post('postLogin/reSendCredicial')
  @ApiOperation({ summary: 'Invite Sub User' })
  @ApiResponse({ status: 200, description: 'Invite Sub User', type: '' })
  reSendCredicial( @Request() request) {
    return this.subUserService.reSendCredicial( request);
  }

  @Post('postLogin/addLocationToUser')
  @ApiOperation({ summary: 'Invite Sub User' })
  @ApiResponse({ status: 200, description: 'Invite Sub User', type: '' })
  addLocationToUser(@Request() request) {
    return this.subUserService.addLocationToUser(request);
  }

  @Post('postLogin/actionOnSubUser')
  @ApiOperation({ summary: 'Action Sub User' })
  @ApiResponse({ status: 200, description: 'Action Sub User', type: '' })
  actionOnSubUser(@Request() request) {
    return this.subUserService.actionOnSubUser(request);
  }

  @Post('postLogin/removeLocation')
  @ApiOperation({ summary: 'Remove Location' })
  @ApiResponse({ status: 200, description: 'Remove Location', type: '' })
  removeLocation(@Request() request) {
    return this.subUserService.removeLocation(request);
  }
  
  @Get('postLogin/getSubUserBasedOnDesiganationId')
  @ApiOperation({ summary: 'Get Sub User Data' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Get Sub User Data', type: '' })
  getSubUserBasedOnDesiganationId(@Request() request) {
    return this.subUserService.getSubUserBasedOnDesiganationId(request);
  }

  @Get('postLogin/getSubUserBasedOnRoleId')
  @ApiOperation({ summary: 'Get Sub User Data' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Get Sub User Data', type: '' })
  getSubUserBasedOnRoleId(@Request() request) {
    return this.subUserService.getSubUserBasedOnRoleId(request);
  }

  @Get('postLogin/getSubUserBasedOnRoleIds')
  @ApiOperation({ summary: 'Get Sub User Data' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Get Sub User Data', type: '' })
  getSubUserBasedOnRoleIds(@Request() request) {
    return this.subUserService.getSubUserBasedOnRoleIds(request);
  }

  
}
