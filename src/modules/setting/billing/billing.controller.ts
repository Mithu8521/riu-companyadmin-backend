import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { VerifyTokenGuard } from '@utils/guards/verify-token/verify-token.guards';
import { BillingService } from './billing.service';
@UseGuards(VerifyTokenGuard)
@ApiTags('Billing Management')
@Controller('v1.0')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('postLogin/getSubcriptionPlane')
  @ApiOperation({ summary: 'Get Subcription Plane Data' })
  @ApiBearerAuth('authorization')
  @ApiHeader({
    name: 'authorization',
    description: 'Is authorization',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Get Subcription Plane Data',
    type: '',
  })
  getSubcriptionPlane(@Request() request) {
    return this.billingService.getSubcriptionPlane(request);
  }

  @Post('postLogin/cancelPlan')
  @ApiOperation({ summary: 'Cancel Subcription Plane' })
  @ApiResponse({
    status: 200,
    description: 'Cancel Subcription Plane',
    type: '',
  })
  cancelPlan(@Req() request) {
    return this.billingService.cancelPlan(request);
  }

  @Post('postLogin/updradPlan')
  @ApiOperation({ summary: 'Updrad Subcription Plane' })
  @ApiResponse({
    status: 200,
    description: 'Updrad Subcription Plane',
    type: '',
  })
  updradPlan(@Req() request) {
    return this.billingService.updradPlan(request);
  }

  @Post('postLogin/downdradPlan')
  @ApiOperation({ summary: 'Updrad Subcription Plane' })
  @ApiResponse({
    status: 200,
    description: 'Updrad Subcription Plane',
    type: '',
  })
  downdradPlan(@Req() request) {
    return this.billingService.downdradPlan(request);
  }
}

