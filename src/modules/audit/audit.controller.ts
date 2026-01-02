import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { ApiBearerAuth, ApiBody, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AssignQuestionToAuditorDto } from './dto/assign-auditor.dto';
import { ValidateAnswerDto } from './dto/validate-answer.dto';
import { VerifyTokenGuard } from '@utils/guards/verify-token/verify-token.guards';
@UseGuards(VerifyTokenGuard)
@ApiTags('Get Audit Listing')
@Controller('v1.0')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('postLogin/getAuditListing')
  @ApiOperation({ summary: 'Get Audit Listing' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Get Audit Listing' })
  getAuditListing(@Req() request) {
    return this.auditService.getAuditListing(request);
  }

  @Get('postLogin/getAuditHistory')
  @ApiOperation({ summary: 'Get Audit History' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Get Audit History' })
  getAuditHistory(@Req() request) {
    return this.auditService.getAuditHistory(request);
  }

  @Post('postLogin/assignedQuestionToAuditor')
  @ApiOperation({ summary: 'Assigned Question To Auditor' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'token', required: true })
  @ApiResponse({ status: 200, description: 'Assigned Question To Auditor' })
  @ApiBody({ type: AssignQuestionToAuditorDto, description: 'api body' })
  assignedQuestionToUser(@Body() body: AssignQuestionToAuditorDto, @Req() request) {
    return this.auditService.assignedQuestionToUser(body, request);
  }

  @Post('postLogin/validateAnswers')
  @ApiOperation({ summary: 'Validate Question To Auditor' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'token', required: true })
  @ApiResponse({ status: 200, description: 'Validate Question To Auditor' })
  @ApiBody({ type: ValidateAnswerDto, description: 'api body' })
  validateAnswers(@Body() body: ValidateAnswerDto, @Req() request) {
    return this.auditService.validateAnswers(body, request);
  }

  @Post('postLogin/validateAllAnswers')
  @ApiOperation({ summary: 'Validate Question To Auditor' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'token', required: true })
  @ApiResponse({ status: 200, description: 'Validate Question To Auditor' })
  @ApiBody({ description: 'api body' })
  validateAllAnswers( @Req() request) {
    return this.auditService.validateAllAnswers(request);
  }

  @Post('postLogin/validateAllLocationAnswers')
  @ApiOperation({ summary: 'Validate Question To Auditor' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'token', required: true })
  @ApiResponse({ status: 200, description: 'Validate Question To Auditor' })
  @ApiBody({ description: 'api body' })
  validateAllLocationAnswers( @Req() request) {
    return this.auditService.validateAllLocationAnswers(request);
  }
  
  
}
