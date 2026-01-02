import { Controller, Get, Post, Body, Req, Request, UseGuards } from '@nestjs/common';
import { TraineeService } from './trainee.service';
import { ApiBearerAuth, ApiBody, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SignInTraineeDto } from './dto/signin-trainee.dto';
import { SignUpTraineeDto } from './dto/signup-trainee.dto';
import { ValidateTraineeDto } from './dto/validate-trainee.dto';
import { VerifyTokenGuard } from '@utils/guards/verify-token/verify-token.guards';
import { ValidateInvitationTrainingDto } from './dto/validate-invitation-status';
import { SignUpExternalTraineeDto } from './dto/external-trainee-resister.dto';
import { BulkSignUpTraineeDto } from './dto/bulk-SignUp-trainee.dto';
import { UploadParticipantDto } from './dto/upload-participant-dto';
@UseGuards(VerifyTokenGuard)
@ApiTags('Trainee Module')
@Controller('v1.0')
export class TraineeController {
  constructor(private readonly traineeService: TraineeService) { }

  @Get('postLogin/getTraineeData')
  @ApiOperation({ summary: 'Get Trainee Data' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Get Trainee Data' })
  getTraineeData(@Req() request) {
    return this.traineeService.getTraineeData(request);
  }

  @Post('auth/signupTrainee')
  @ApiOperation({ summary: 'Signup Trainee' })
  @ApiResponse({ status: 200, description: 'Sign Up Trainee', type: '' })
  signupCompany(@Body() body: SignUpTraineeDto, @Req() request) {
    return this.traineeService.signupTrainee(body, request);
  }

  @Post('auth/signupExternalTrainee')
  @ApiOperation({ summary: 'Signup Trainee' })
  @ApiResponse({ status: 200, description: 'Sign Up Trainee', type: '' })
  signupExternalTrainee(@Body() body: SignUpExternalTraineeDto, @Req() request) {
    return this.traineeService.signupExternalTrainee(body, request);
  }

  @Post('auth/markAttendenceExternalTrainee')
  @ApiOperation({ summary: 'Signup Trainee' })
  @ApiResponse({ status: 200, description: 'Sign Up Trainee', type: '' })
  markAttendenceExternalTrainee(@Req() request) {
    return this.traineeService.markAttendenceExternalTrainee( request);
  }

  @Get('auth/getExternalTrainee')
  @ApiOperation({ summary: 'Get Trainee Data' })
  @ApiResponse({ status: 200, description: 'Get Trainee Data' })
  getExternalTrainee(@Req() request) {
    return this.traineeService.getExternalTrainee(request);
  }

  @Post('auth/loginTrainee')
  @ApiOperation({ summary: 'Login Trainee' })
  @ApiResponse({ status: 200, description: 'Login Trainee', type: '' })
  loginTrainee(@Body() body: SignInTraineeDto, @Request() request) {
    return this.traineeService.loginTrainee(body, request);
  }

  @Post('postLogin/validatedInvitedTraining')
  @ApiOperation({ summary: 'Validated invitation training status' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'token', required: true })
  @ApiResponse({ status: 200, description: 'Validated invitation training status' })
  @ApiBody({ type: ValidateInvitationTrainingDto, description: 'api body' })
  validatedInvitedTraining(@Body() body: ValidateInvitationTrainingDto, @Req() request) {
    return this.traineeService.validatedInvitedTraining(body, request);
  }

  @Post('postLogin/signupBulkTrainee')
  @ApiOperation({ summary: 'Bulk Registration' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'token', required: true })
  @ApiResponse({ status: 200, description: 'Bulk Registration' })
  @ApiBody({ type: BulkSignUpTraineeDto, description: 'api body' })
  signupBulkTrainee(@Body() body: BulkSignUpTraineeDto, @Req() request) {
    return this.traineeService.signupBulkTrainee(body, request);
  } 
  
  @Post('postLogin/uploadParticipant')
  @ApiOperation({ summary: 'Bulk Upload for Trainee' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'token', required: true })
  @ApiResponse({ status: 200, description: 'Bulk Upload for Trainee' })
  @ApiBody({ type: UploadParticipantDto, description: 'api body' })
  uploadParticipant(@Body() body: UploadParticipantDto, @Req() request) {
    return this.traineeService.uploadParticipant(body, request);
  }   

  @Post('postLogin/validatedTrainingStatus')
  @ApiOperation({ summary: 'Validated training status' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'token', required: true })
  @ApiResponse({ status: 200, description: 'Validated training status' })
  @ApiBody({ type: ValidateTraineeDto, description: 'api body' })
  validatedTrainingStatus(@Body() body: ValidateTraineeDto, @Req() request) {
    return this.traineeService.validatedTrainingStatus(body, request);
  }

  @Get('postLogin/getAllRegisteredTrainee')
  @ApiOperation({ summary: 'Get All Registered Trainee' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Get All Registered Trainee' })
  getAllRegisteredTrainee(@Req() request) {
    return this.traineeService.getAllRegisteredTrainee(request);
  }
  
}
