import { Controller, Get, Post, Body, Req, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { VerifyTokenGuard } from '@utils/guards/verify-token/verify-token.guards';
import { PermissionService } from './permission.service';
import { CreateRoleMasterDto } from './dto/create-role-master.dto';
import { UpdateRoleMasterDto } from './dto/update-role-master.dto';
import { DeleteRoleMasterDto } from './dto/delete-role-master.dto';

@UseGuards(VerifyTokenGuard)
@ApiTags('Permission & Role Management')
@Controller('v1.0')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Post('postLogin/createRoleMaster')
  @ApiOperation({ summary: 'Create role' })
  @ApiResponse({ status: 200, description: 'Create role', type: '' })
  createRoleMaster(@Body() createRoleMasterDto: CreateRoleMasterDto, @Req() request) {
    return this.permissionService.createRoleMaster(createRoleMasterDto, request);
  }

  @Get('postLogin/getMasterData')
  @ApiOperation({ summary: 'Get Role Master Data' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Get Role Master Data', type: '' })
  getRoleMasterData(@Request() request) {
    return this.permissionService.getRoleMasterData(request);
  }

  @Get('postLogin/getRoleMasterDataBasedOnId')
  @ApiOperation({ summary: 'Get Role Master Data' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Get Role Master Data', type: '' })
  getRoleMasterDataBasedOnId(@Request() request) {
    return this.permissionService.getRoleMasterDataBasedOnId(request);
  }

  @Get('postLogin/updateAcceptence')
  @ApiOperation({ summary: 'Update Acceptence' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Update Acceptence', type: '' })
  updateAcceptence(@Request() request) {
    return this.permissionService.updateAcceptence(request);
  }

  @Post('postLogin/updateRoleMaster')
  @ApiOperation({ summary: 'Update Role Data' })
  @ApiResponse({ status: 200, description: 'Update Role Data', type: '' })
  updateRoleMaster(@Body() updateRoleMasterDto: UpdateRoleMasterDto, @Req() request) {
    return this.permissionService.updateRoleMaster(updateRoleMasterDto, request);
  }

  @Post('postLogin/deleteRoleMaster')
  @ApiOperation({ summary: 'Delete Role Master Data' })
  @ApiResponse({ status: 200, description: 'Delete Role Master Data', type: '' })
  deleteRoleMaster(@Body() deleteRoleMasterDto: DeleteRoleMasterDto, @Req() request) {
    return this.permissionService.deleteRoleMaster(deleteRoleMasterDto, request);
  }

  @Post('postLogin/updatePermissionToRole')
  @ApiOperation({ summary: 'Give permission or update permission to role' })
  @ApiResponse({ status: 200, description: 'Give permission or update permission to role', type: '' })
  giveOrUpdatePermissionToRole(@Req() request) {
    return this.permissionService.updatePermissionToRole(request);
  }

  @Get('postLogin/getPermissionDataBasedOnRoleId')
  @ApiOperation({ summary: 'Get Permission Master Data' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Get Permission Master Data', type: '' })
  getPermissionMasterData(@Request() request) {
    return this.permissionService.getPermissionMasterData(request);
  }
}
