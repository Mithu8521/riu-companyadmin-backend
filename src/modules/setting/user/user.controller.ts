import { Controller, Get, Post, Body, Req, Request, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateCompanyDto } from './dto/create-user.dto';
import { ApiBearerAuth, ApiBody, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LoginCompanyDto } from './dto/login-company.dto';
import { VerifyTokenGuard } from '@utils/guards/verify-token/verify-token.guards';
import { OtpSendDto } from './dto/otp-user.dto';
import { OtpVerifyDto } from './dto/otp-verify.dto';
import { RemoveUsersBulkDto } from './dto/remove-user.dto';

@UseGuards(VerifyTokenGuard)
@ApiTags('Company Management')
@Controller('v1.0')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Post('auth/signup')
  @ApiOperation({ summary: 'Signup company' })
  @ApiResponse({ status: 200, description: 'Sign Up company', type: '' })
  signupCompany(@Body() createCompanyDto: CreateCompanyDto, @Req() request) {
    return this.userService.signupCompany(createCompanyDto, request);
  }

  @Post('auth/login')
  @ApiOperation({ summary: 'Login company' })
  @ApiResponse({ status: 200, description: 'Login company' })
  lognCompany(@Body() loginCompanyDto: LoginCompanyDto, @Request() request) {
    const startTime = Date.now();
    console.log('Start Time:', new Date(startTime).toISOString());

    const result = this.userService.lognCompany(loginCompanyDto, request);

    return Promise.resolve(result).then(res => {
      const endTime = Date.now();
      console.log('End Time:', new Date(endTime).toISOString());
      console.log('Execution time:', endTime - startTime, 'ms');
      return res;
    });
  }

  @Post('auth/sendOtp')
  @ApiOperation({ summary: 'Verify Token' })
  @ApiResponse({ status: 200, description: 'Verify Token', type: '' })
  sendOtp(@Body() otpSendDto: OtpSendDto, @Request() request) {
    return this.userService.sendOtp(otpSendDto, request);
  }

  @Post('auth/verifyOtp')
  @ApiOperation({ summary: 'Verify Token' })
  @ApiResponse({ status: 200, description: 'Verify Token', type: '' })
  verifyOtp(@Body() otpVerifyDto: OtpVerifyDto, @Request() request) {
    return this.userService.verifyOtp(otpVerifyDto, request);
  }

  @Post('postLogin/handleToggleTwoFactor')
  @ApiOperation({ summary: 'Get Notification Data' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Get Notification Data', type: '' })
  @ApiBody({ description: 'API body' })
  handleToggleTwoFactor(@Request() request) {
    return this.userService.handleToggleTwoFactor(request);
  }

  @Post('auth/verifyPasswordResetToken')
  @ApiOperation({ summary: 'Verify Token' })
  @ApiResponse({ status: 200, description: 'Verify Token', type: '' })
  verifyPasswordResetToken(@Request() request) {
    return this.userService.verifyPasswordResetToken(request);
  }

  @Post('auth/resetPassword')
  @ApiOperation({ summary: 'Password Reset' })
  @ApiResponse({ status: 200, description: 'Password Reset', type: '' })
  resetPassword(@Request() request) {
    return this.userService.resetPassword(request);
  }

  @Get('auth/emailStatusCheckAndSend')
  @ApiOperation({ summary: 'Email Status' })
  @ApiResponse({ status: 200, description: 'Email Status', type: '' })
  emailStatusCheckAndSend(@Request() request) {
    return this.userService.emailStatusCheckAndSend(request);
  }

  @Post('postLogin/changePassword')
  @ApiOperation({ summary: 'Password Changed' })
  @ApiResponse({ status: 200, description: 'Password Changed', type: '' })
  changePassword(@Request() request) {
    return this.userService.changePassword(request);
  }

  @Get('postLogin/getProfileData')
  @ApiOperation({ summary: 'Get Profile Data' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Get Profile Data', type: '' })
  getProfileData(@Request() request) {
    return this.userService.getProfileData(request);
  }

  @Get('postLogin/usersActivity')
  @ApiOperation({ summary: 'Get Users Activity Data' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Get Users Activity Data', type: '' })
  usersActivity(@Request() request) {
    return this.userService.usersActivity(request);
  }

  @Get('postLogin/getNotificationToUser')
  @ApiOperation({ summary: 'Get Notification Data' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Get Notification Data', type: '' })
  getNotificationToUser(@Request() request) {
    return this.userService.getNotificationToUser(request);
  }

  @Post('postLogin/updateUserProfile')
  @ApiOperation({ summary: 'Update Profile' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Token', required: true })
  @ApiResponse({ status: 200, description: 'Update Profile', type: '' })
  @ApiBody({ description: 'API body' })
  updateUserProfile(@Request() request) {
    return this.userService.updateUserProfile(request);
  }

  @Post('postLogin/logout')
  @ApiOperation({ summary: 'logout Profile' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Token', required: true })
  @ApiResponse({ status: 200, description: 'Update Profile', type: '' })
  @ApiBody({ description: 'API body' })
  logout(@Request() request) {
    return this.userService.logout(request);
  }

  @Post('postLogin/uploadProfilePictureOrAttachment')
  @ApiOperation({ summary: 'Update Profile Or Attachment' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Token', required: true })
  @ApiResponse({ status: 200, description: 'Update Profile Or Attachment', type: '' })
  @ApiBody({ description: 'API body' })
  uploadProfilePictureOrAttachment(@Request() request) {
    return this.userService.uploadProfilePictureOrAttachment(request);
  }

  @Post('postLogin/removeUsersInBulk')
  @ApiOperation({
    summary: 'Remove users in bulk with left dates',
    description: 'Removes multiple users by setting their left dates. Users must leave within the specified financial year period.'
  })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Bearer token', required: true })
  @ApiResponse({ status: 200, description: 'Users removed successfully', type: '' })
  @ApiBody({ description: 'API body' })
  removeUsersInBulk(@Body() removeUsersBulkDto: RemoveUsersBulkDto, @Req() request) {
    return this.userService.removeUsersInBulk(removeUsersBulkDto, request);
  }
  
}
