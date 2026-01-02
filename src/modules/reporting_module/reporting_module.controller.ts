import { Body, Controller, Get, Post, Req, Param, Query } from '@nestjs/common';
import { ReportingModuleService } from './reporting_module.service';
import { ApiBearerAuth, ApiBody, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SaveAnswerReportingQuestionDto } from './dto/save-reporting_answer.dto';
import { SaveReportingDueDateApproveDto } from './dto/save-reporting_due_date_approve.dto';
import { SaveReportingDueDateBulkRequestDto } from './dto/save-reporting_due_date_request.dto';
import { SocketGateway } from '../socket/socket.gateway';
import { NotificationService } from '../setting/notification/notification.service';

@ApiTags('Reporting Question Answer Module')
@Controller('v1.0')
export class ReportingModuleController {
  constructor(private readonly reportingModuleService: ReportingModuleService,private readonly notificationService:NotificationService , private readonly socketGateway: SocketGateway) { }
  @Get('postLogin/getReportingQuestion')
  @ApiOperation({ summary: 'Get Reporting Question' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Get Reporting Question' })
  getSectorQuestion(@Req() request) {
    return this.reportingModuleService.getReportingQuestion(
      request.headers.userid, request.query.financialYearId, request.query.current_role, request.query.frameworkIds);
  }
  @Get('postLogin/reporting/chats')
  @ApiOperation({ summary: 'Get Reporting Chats' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Get Reporting Chats' })
  getChatForReportingQueAns(@Req() request) {
    let filter:any = {}
    filter = request.query;
    return this.reportingModuleService.getChatsForAnswer(filter);
  }
  @Get('postLogin/reporting/chats/participants')
  @ApiOperation({ summary: 'Get Chat Participants' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Get Chat Participants' })
   getParticipants(@Req() request) {
    let filter:any = {}
    filter = request.query;  
    const currentUserId = request.headers.userid; 
    return  this.reportingModuleService.getParticipantsForChat(filter,currentUserId);
  }
  
@Post('postLogin/reporting/chats')
@ApiOperation({ summary: 'Append a chat message' })
@ApiBearerAuth('authorization')
@ApiHeader({ name: 'authorization', description: 'token', required: true })
@ApiResponse({ status: 200, description: 'Chat message appended' })
@ApiBody({ description: 'Chat message payload' })
async appendChatMessage(
  @Body() msgData: any,
  @Req() request: any,
) {
  const currentUserId = Number(request.headers.userid);
  
  const {
    saved,
    roomName,
    payload,
    participants,
    mailContext,
  } = await this.reportingModuleService.appendChatMessageFlow(msgData, currentUserId);
  
  this.socketGateway.emitChatMessage(roomName, payload);  
  this.socketGateway.emitParticipantsUpdate(roomName, {participants})

  await this.notificationService.createForChat(saved, roomName, participants, mailContext);

  await this.reportingModuleService.notifyChatRecipients(
    { ...saved, senderName: mailContext.senderName },
    roomName,
    participants,
    mailContext,
  );

  return saved;
}

  
  @Post('postLogin/saveAnswerReportingQuestion')
  @ApiOperation({ summary: 'Save Answer Reporting Question' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'token', required: true })
  @ApiResponse({ status: 200, description: 'Save Answer Sector Question' })
  @ApiBody({ type: SaveAnswerReportingQuestionDto, description: 'api body' })
  saveAnswerReportingQuestion(@Body() body: SaveAnswerReportingQuestionDto, @Req() request) {
    return this.reportingModuleService.saveAnswerReportingQuestion(body, request);
  }

  @Post('postLogin/dueDate/requestOverride')
  @ApiOperation({ summary: 'Save Bulk Due Date Request Overrides' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'token', required: true })
  @ApiResponse({ status: 200, description: 'Save Bulk Due Date Request Overrides' })
  @ApiBody({ type: SaveReportingDueDateBulkRequestDto, description: 'Array of Due Date Override Requests' })
  requestOverrideBulk(@Body() body: SaveReportingDueDateBulkRequestDto, @Req() request) {
    return this.reportingModuleService.dueDateRequestOverrideBulk(body, request);
  }

  @Post('postLogin/dueDate/requestOverride/approve')
  @ApiOperation({ summary: 'Save Due Date Request Override Approve' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'token', required: true })
  @ApiResponse({ status: 200, description: 'Save Due Date Request Override Approve' })
  @ApiBody({ type: SaveReportingDueDateApproveDto, description: 'api body' })
  requestOverrideApprove(@Body() body: SaveReportingDueDateApproveDto, @Req() request) {
    return this.reportingModuleService.dueDateRequestOverrideApprove(body, request);
  }

  @Get('postLogin/dueDate/Overrides')
  @ApiOperation({ summary: 'Get Due Date Overrides by Financial Year' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'JWT Token', required: true })
  @ApiResponse({ status: 200, description: 'List of Due Date Overrides' })
  getDueDateOverrides(@Query('financialYearId') financialYearId: number, @Req() request) {
    return this.reportingModuleService.getDueDateOverridesByFinancialYear(financialYearId, request);
  }

  @Post('postLogin/saveAnswerReportingQuestions')
  @ApiOperation({ summary: 'Save Answer Reporting Question' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'token', required: true })
  @ApiResponse({ status: 200, description: 'Save Answer Sector Question' })
  @ApiBody({ type: SaveAnswerReportingQuestionDto, description: 'api body' })
  saveAnswerReportingQuestions(@Body() body: SaveAnswerReportingQuestionDto, @Req() request) {
    return this.reportingModuleService.saveAnswerReportingQuestions(body, request);
  }

  @Get('postLogin/getReportingQuestionAnswer')
  @ApiOperation({ summary: 'Get Reporting Answer' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Get Reporting Answer' })
  getReportingQuestionAnswer(@Req() request) {
    return this.reportingModuleService.getReportingQuestionAnswer(request);
  }

  @Get('postLogin/getReportingAnswer')
  @ApiOperation({ summary: 'Get Reporting Answer' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Get Reporting Answer' })
  getReportingAnswer(@Req() request) {
    return this.reportingModuleService.getReportingAnswer(request);
  }

  @Get('postLogin/getReportingQuestionAnswerBasedFinancialYear')
  @ApiOperation({ summary: 'Get Reporting Answer' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Get Reporting Answer' })
  getReportingQuestionAnswerBasedFinancialYear(@Req() request) {
    return this.reportingModuleService.getReportingQuestionAnswerBasedFinancialYear(request);
  }


  @Get('postLogin/getReportingPreviousYearAnswer')
  @ApiOperation({ summary: 'Get Reporting Answer' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Get Reporting Answer' })
  getReportingPreviousYearAnswer(@Req() request) {
    return this.reportingModuleService.getReportingPreviousYearAnswer(request);
  }

  @Get('postLogin/getReportingQuestionAssign')
  @ApiOperation({ summary: 'Get Reporting Answer' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Get Reporting Answer' })
  getReportingQuestionAssign(@Req() request) {
    return this.reportingModuleService.getReportingQuestionAssign(request);
  }

  @Get('postLogin/getAssignedReportingQuestionDetails')
  @ApiOperation({ summary: 'Get Reporting Answer' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Get Reporting Answer' })
  getAssignedReportingQuestionDetails(@Req() request) {
    return this.reportingModuleService.getAssignedReportingQuestionDetails(request);
  }

  @Get('postLogin/dashbord/reportingModule')
  @ApiOperation({ summary: 'Get Reporting Module' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Get Reporting Module' })
  getReportingModule(@Req() request) {
    return this.reportingModuleService.getReportingModule(request);
  }

  // @Post('postLogin/uploadAndParseBill')
  // @ApiOperation({ summary: 'Upload and Parse Bill' })
  // @ApiBearerAuth('authorization')
  // @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  // @UseInterceptors(FileInterceptor('file'))
  // uploadAndParseBill(@Req() req, @UploadedFile() file: Express.Multer.File) {
  //   return this.reportingModuleService.uploadAndParseBill(req, file);
  // }
}
