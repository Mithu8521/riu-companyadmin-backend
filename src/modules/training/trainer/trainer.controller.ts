import { Body, Controller, Get, Post, Req, Request, UseGuards } from '@nestjs/common';
import { TrainerService } from './trainer.service';
import { ApiBearerAuth, ApiBody, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateTrainingDto } from './dto/create-training.dto';
import { UpdateTrainingDto } from './dto/update-trainer.dto';
import { DeleteTrainingDto } from './dto/delete-training.dto';
import { VerifyTokenGuard } from '@utils/guards/verify-token/verify-token.guards';
import { AddTraineeAndInviteTraineeDto } from './dto/add-trainee-and-Invite-trainee.dto';
import { CreateTopicDto } from './dto/create-topic.dto';
import { RemoveUsersFromTrainingBulkDto } from './dto/remove-user.dto';

@UseGuards(VerifyTokenGuard)
@ApiTags('Training Module')
@Controller('v1.0')
export class TrainerController {
  constructor(private readonly trainerService: TrainerService) { }

  @Get('postLogin/getTrainingData')
  @ApiOperation({ summary: 'Get Training Data' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Get Training Data' })
  getTrainingData(@Req() request) {
    return this.trainerService.getTrainingData(request);
  }

  @Post('postLogin/createNewTraining')
  @ApiOperation({ summary: 'Create New Training' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'token', required: true })
  @ApiResponse({ status: 200, description: 'Create New Training' })
  @ApiBody({ type: CreateTrainingDto, description: 'api body' })
  createNewTraining(@Body() body: CreateTrainingDto, @Req() request) {
    return this.trainerService.createNewTraining(body, request);
  }

  @Post('postLogin/createNewTopic')
  @ApiOperation({ summary: 'Create New Topic' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'token', required: true })
  @ApiResponse({ status: 200, description: 'Create New Training' })
  @ApiBody({ type: CreateTopicDto, description: 'api body' })
  createNewTopic(@Body() body: CreateTopicDto, @Req() request) {
    return this.trainerService.createNewTopic(body, request);
  }

  @Post('postLogin/updateTraining')
  @ApiOperation({ summary: 'Update Training' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'token', required: true })
  @ApiResponse({ status: 200, description: 'Update Training' })
  @ApiBody({ type: UpdateTrainingDto, description: 'api body' })
  updateTraining(@Body() body: UpdateTrainingDto, @Req() request) {
    return this.trainerService.updateTraining(body, request);
  }

  @Post('postLogin/deleteTrainingData')
  @ApiOperation({ summary: 'Delete Training Data' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'token', required: true })
  @ApiResponse({ status: 200, description: 'Delete Training Data' })
  @ApiBody({ type: DeleteTrainingDto, description: 'api body' })
  deleteTrainingData(@Body() body: DeleteTrainingDto, @Req() request) {
    return this.trainerService.deleteTrainingData(body, request);
  }

  @Get('postLogin/getTrainingTopicMapping')
  @ApiOperation({ summary: 'Get topic-wise principle data' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Get topic-wise principle data' })
  getTrainingTopicMapping(@Req() request) {
    return this.trainerService.getTrainingTopicMapping(request);
  }

  @Get('postLogin/getTrainingCategory')
  @ApiOperation({ summary: 'Get Training Category' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Get Training Category' })
  getTrainingCategory(@Req() request) {
    return this.trainerService.getTrainingCategory(request);
  }

  @Get('postLogin/getTrainingPrinciples')
  @ApiOperation({ summary: 'Get Training Principles' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Get Training Principles' })
  getTrainingPrinciples(@Req() request) {
    return this.trainerService.getTrainingPrinciples(request);
  }

  @Get('postLogin/getAllTrainingDataForFilter')
  @ApiOperation({ summary: 'Training Progress' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'token', required: true })
  @ApiResponse({
    status: 200,
    description: 'Training Progress',
    type: '',
  })
  getAllTrainingDataForFilter(@Request() request) {
    return this.trainerService.getAllTrainingDataForFilter(request);
  }

  @Get('postLogin/graph/Training')
  @ApiOperation({ summary: 'Training Progress' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'token', required: true })
  @ApiResponse({
    status: 200,
    description: 'Training Progress',
    type: '',
  })
  getAllTrainingDataForGraph(@Request() request) {
    return this.trainerService.getAllTrainingDataForGraph(request);
  }

  @Get('postLogin/getTraineeUserData')
  @ApiOperation({ summary: 'Get topic-wise principle data' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Is authorization', required: true })
  @ApiResponse({ status: 200, description: 'Get topic-wise principle data' })
  getTraineeUserData(@Req() request) {
    return this.trainerService.getTraineeUserData(request);
  }

  @Post('postLogin/addTraineeOrInviteTrainee')
  @ApiOperation({ summary: 'Add Trainee Or Invite Trainee' })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'token', required: true })
  @ApiResponse({ status: 200, description: 'Add Trainee Or Invite Trainee' })
  @ApiBody({ type: AddTraineeAndInviteTraineeDto, description: 'api body' })
  addTraineeOrInviteTrainee(@Body() body: AddTraineeAndInviteTraineeDto, @Req() request) {
    return this.trainerService.addTraineeOrInviteTrainee(body, request);
  }

  @Get('auth/getTraineeEmail')
  @ApiOperation({ summary: 'Get Trainee Email' })
  @ApiResponse({ status: 200, description: 'Get Trainee Email', type: '' })
  getTraineeEmail(@Request() request) {
    return this.trainerService.getTraineeEmail(request);
  }

  @Get('auth/getTraineeData')
  @ApiOperation({ summary: 'Get Trainee Email' })
  @ApiResponse({ status: 200, description: 'Get Trainee Email', type: '' })
  getTraineeData(@Request() request) {
    return this.trainerService.getTraineeData(request);
  }

  @Post('postLogin/removeUsersFromTrainingInBulk')
  @ApiOperation({
    summary: 'Remove users from training in bulk',
    description: 'Removes multiple users from their assigned trainings by updating the training user arrays.'
  })
  @ApiBearerAuth('authorization')
  @ApiHeader({ name: 'authorization', description: 'Bearer token', required: true })
  @ApiResponse({ status: 200, description: 'Users removed from training successfully', type: '' })
  @ApiBody({ description: 'API body' })
  removeUsersFromTrainingInBulk(@Body() removeUsersFromTrainingBulkDto: RemoveUsersFromTrainingBulkDto) {
    return this.trainerService.removeUsersFromTrainingInBulk(removeUsersFromTrainingBulkDto);
  }
}
