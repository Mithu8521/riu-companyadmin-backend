import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { VerifyTokenGuard } from '@utils/guards/verify-token/verify-token.guards';
import { SupplierManagementService } from './supplier_management.service';
import { InviteSupplierManagementDto } from './dto/invite-supplier_management.dto';
import { ActionSupplierInvitation } from './dto/action-supplier-invitation.dto';
import { ActionSupplierRegistered } from './dto/action-supplier-registered.dto';

@UseGuards(VerifyTokenGuard)
@ApiTags('Supplier Management Apis')
@Controller('v1.0')
export class SupplierManagementController {
  constructor(private readonly supplierManagementService: SupplierManagementService) { }

  @Post('postLogin/inviteSupplier')
  @ApiOperation({ summary: 'Invite Supplier' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Invite Supplier', type: '', })
  inviteSupplier(@Body() inviteSupplierManagementDto: InviteSupplierManagementDto, @Req() request) {
    return this.supplierManagementService.inviteSupplier(inviteSupplierManagementDto, request);
  }

  @Get('postLogin/getSupplier')
  @ApiOperation({ summary: 'Get Supplier' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Get Supplier' })
  getSupplier(@Req() request) {
    return this.supplierManagementService.getSupplier(request);
  }

  @Post('postLogin/actionSupplierRequest')
  @ApiOperation({ summary: 'Cancel or Resend to supplier' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Cancel or Resend to supplier', type: '', })
  actionSupplierRequest(@Body() actionSupplierInvitation: ActionSupplierInvitation, @Req() request) {
    return this.supplierManagementService.actionSupplierRequest(actionSupplierInvitation, request);
  }

  @Post('postLogin/actionRegisteredSupplier')
  @ApiOperation({ summary: 'Active or Inactive to supplier' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Active or Inactive  to supplier', type: '', })
  actionRegisteredSupplier(@Body() actionSupplierRegistered: ActionSupplierRegistered, @Req() request) {
    return this.supplierManagementService.actionRegisteredSupplier(actionSupplierRegistered, request);
  }

}
