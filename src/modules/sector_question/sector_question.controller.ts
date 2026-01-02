import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { SectorQuestionService } from './sector_question.service';
import { ApiBearerAuth, ApiBody, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AssignQuestionDto } from './dto/assign-sector-question.dto';
import { SaveAnswerQuestionDto } from './dto/save-answer-sector-question.dto';
import { RequestDueDateDto } from './dto/request-due-date.dto';
import { UpdateDueDateDto } from './dto/update-due-date.dto';
import { ReminderUserDto } from './dto/remider-user.dto';
import { ReAssignQuestionDto } from './dto/reassign-sector-question.dto';
import { AddRowSectorQuestionDto } from './dto/add-row-sector-question.dto';
import { VerifyTokenGuard } from '@utils/guards/verify-token/verify-token.guards';
import { EmailReminderDto } from './dto/email-reminder.dto';
import { ReportGenerationSettingDto, ReportGenerationSettingsDto } from './dto/report-generation-settings.dto';
import { GenerateReportRequestDto, GenerateReportResponseDto } from './dto/generate-report.dto';

@UseGuards(VerifyTokenGuard)
@ApiTags('Sector Question Answer Module')
@Controller('v1.0')
export class SectorQuestionController {
  constructor(private readonly sectorQuestionService: SectorQuestionService) { }

  @Get('postLogin/getSectorQuestion')
  @ApiOperation({ summary: 'Get Sector Question' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Get Sector Question' })
  getSectorQuestion(@Req() request) {
    return this.sectorQuestionService.getSectorQuestion(request);
  }

  @Get('postLogin/getReportGenerated')
  @ApiOperation({ summary: 'Get Sector Question' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Get Sector Question' })
  getReportGenerated(@Req() request) {
    return this.sectorQuestionService.getReportGenerated(request);
  }

  @Get('postLogin/getSectorQuestionAnswer')
  @ApiOperation({ summary: 'Get Sector Question' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Get Sector Question' })
  getSectorQuestionAnswer(@Req() request) {
    return this.sectorQuestionService.getSectorQuestionAnswers(request);
  }

  @Get('postLogin/getAssignedDetails')
  @ApiOperation({ summary: 'Get Sector Question' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Get Sector Question' })
  getAssignedDetails(@Req() request) {
    return this.sectorQuestionService.getAssignedDetails(request);
  }

  @Get('postLogin/getAssignedQuestionDetails')
  @ApiOperation({ summary: 'Get Sector Question' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Get Sector Question' })
  getAssignedQuestionDetails(@Req() request) {
    return this.sectorQuestionService.getAssignedQuestionDetails(request);
  }

  @Get('postLogin/getAssignedQuestion')
  @ApiOperation({ summary: 'Get Sector Question' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Get Sector Question' })
  getAssignedQuestion(@Req() request) {
    return this.sectorQuestionService.getAssignedQuestion(request);
  }

  @Get('postLogin/getViewQuestions')
  @ApiOperation({ summary: 'Get View Question' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Get View Question' })
  getViewQuestions(@Req() request) {
    return this.sectorQuestionService.getViewQuestions(request);
  }

  @Get('postLogin/getCompanyQuestionsCategoryWise')
  @ApiOperation({ summary: 'Get Company Questions CategoryWise' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Get Company Questions CategoryWise' })
  getCompanyQuestionsCategoryWise(@Req() request) {
    return this.sectorQuestionService.getCompanyQuestionsCategoryWise(request);
  }

  @Post('postLogin/generateReport')
  @ApiOperation({ summary: 'Get Company Questions CategoryWise' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Get Company Questions CategoryWise' })
  async generateReport(@Req() request, @Body() body: GenerateReportRequestDto): Promise<GenerateReportResponseDto> {
    return await this.sectorQuestionService.generateReport(request, body);
  }

  
  @Get('postLogin/generateReport/settings')
  @ApiOperation({ summary: 'Get Report Generation Settings' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Get Report Generation Settings' })
  async getReportGenerationSettings(@Req() request): Promise<ReportGenerationSettingsDto> {
    return await this.sectorQuestionService.getReportGenerationSettings(request);
  }

  
  @Post('postLogin/generateReport/settings')
  @ApiOperation({ summary: 'Update Report Generation Settings' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Update Report Generation Settings' })
  async updateReportGenerationSettings(@Req() request, @Body() body: ReportGenerationSettingsDto): Promise<ReportGenerationSettingsDto> {
    return await this.sectorQuestionService.updateReportGenerationSettings(request, body);
  }


  @Post('postLogin/assignedQuestionToUser')
  @ApiOperation({ summary: 'Assigned Question To User' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'token', required: true })
  @ApiResponse({ status: 200, description: 'Assigned Question To User' })
  @ApiBody({ type: AssignQuestionDto, description: 'api body' })
  assignedQuestionToUser(@Body() body: AssignQuestionDto, @Req() request) {
    return this.sectorQuestionService.assignedQuestionToUser(body, request);
  }

  @Post('postLogin/sendReminderEmails')
  @ApiOperation({ summary: 'Send Reminder Emails' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'token', required: true })
  @ApiResponse({ status: 200, description: 'Send Reminder Emails' })
  @ApiBody({ type: EmailReminderDto, description: 'api body' })
  sendReminderEmails(@Body() body: EmailReminderDto, @Req() request) {
    return this.sectorQuestionService.sendReminderEmails(body, request);
  }

  @Post('postLogin/addRow')
  @ApiOperation({ summary: 'Add row to in sector question' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'token', required: true })
  @ApiResponse({ status: 200, description: 'Add row to in sector question' })
  @ApiBody({ type: AddRowSectorQuestionDto, description: 'api body' })
  addRow(@Body() body: AddRowSectorQuestionDto, @Req() request) {
    return this.sectorQuestionService.addRow(body, request);
  }

  @Post('postLogin/reassignedQuestionToUser')
  @ApiOperation({ summary: 'Assigned Question To User' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'token', required: true })
  @ApiResponse({ status: 200, description: 'Assigned Question To User' })
  @ApiBody({ type: ReAssignQuestionDto, description: 'api body' })
  ReassignedQuestionToUser(@Body() body: ReAssignQuestionDto, @Req() request) {
    return this.sectorQuestionService.ReassignedQuestionToUser(body, request);
  }

  @Post('postLogin/requestDueDate')
  @ApiOperation({ summary: 'Request Due Date To Company' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'token', required: true })
  @ApiResponse({ status: 200, description: 'Request Due Date To Company' })
  @ApiBody({ type: RequestDueDateDto, description: 'api body' })
  requestDueDate(@Body() body: RequestDueDateDto, @Req() request) {
    return this.sectorQuestionService.requestDueDate(body, request);
  }

  @Post('postLogin/updateDueDate')
  @ApiOperation({ summary: 'Update Due Date By Company' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'token', required: true })
  @ApiResponse({ status: 200, description: 'Update Due Date By Company' })
  @ApiBody({ type: UpdateDueDateDto, description: 'api body' })
  updateDueDate(@Body() body: UpdateDueDateDto, @Req() request) {
    return this.sectorQuestionService.updateDueDate(body, request);
  }

  @Post('postLogin/reminderToUser')
  @ApiOperation({ summary: 'Reminder To User' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'token', required: true })
  @ApiResponse({ status: 200, description: 'Reminder To User' })
  @ApiBody({ type: ReminderUserDto, description: 'api body' })
  reminderToUser(@Body() body: ReminderUserDto, @Req() request) {
    return this.sectorQuestionService.reminderToUser(body, request);
  }
  
  @Post('postLogin/saveAnswerSectorQuestion')
  @ApiOperation({ summary: 'Save Answer Sector Question' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'token', required: true })
  @ApiResponse({ status: 200, description: 'Save Answer Sector Question' })
  @ApiBody({ type: SaveAnswerQuestionDto, description: 'api body' })
  saveAnswerSectorQuestion(@Body() body: SaveAnswerQuestionDto, @Req() request) {
    return this.sectorQuestionService.saveAnswerSectorQuestion(body, request);
  }

  // @Get('postLogin/generateReport')
  // @ApiOperation({ summary: 'Get Company Questions CategoryWise' })
  // @ApiBearerAuth('authorization')
  // @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  // @ApiResponse({ status: 200, description: 'Get Company Questions CategoryWise' })
  // generateReport(@Req() request) {
  //   return this.sectorQuestionService.generateReport(request);
  // }

}
