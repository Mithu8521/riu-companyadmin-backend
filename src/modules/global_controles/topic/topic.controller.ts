import { Controller, Get, Post, Body, UseGuards, Query, Request } from '@nestjs/common';
import { VerifyTokenGuard } from '@utils/guards/verify-token/verify-token.guards';
import { ApiBearerAuth, ApiBody, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TopicService } from './topic.service';
import { GetTopicDto } from './dto/get-topic.dto';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { DeleteTopicDto } from './dto/delete-topic.dto';
@UseGuards(VerifyTokenGuard)
@ApiTags('Global Controles : Topic')
@Controller('v1.0')
export class TopicController {
  constructor(private readonly topicService: TopicService) {}

	@Get("postLogin/getCustomTopicByFrameworkId")
	@ApiOperation({ summary: "Get topic" })
	@ApiBearerAuth("authorization")
	@ApiHeader({ name: "authorization", description: "token", required: true })
	@ApiResponse({
		status: 200,
		description: "Get topic",
		type: ""
	})
	getTopicByFrameworkId(@Query() getTopicDto:GetTopicDto, @Request() request) {
		return this.topicService.getTopicByFrameworkId(getTopicDto, request);
	}

	@Post("postLogin/createCustomTopic")
	@ApiOperation({ summary: "Create Topic" })
	@ApiBearerAuth("authorization")
	@ApiHeader({ name: "authorization", description: "token", required: true })
	@ApiResponse({
		status: 200,
		description: "Create Topic",
		type: ""
	})
	@ApiBody({ type: CreateTopicDto, description: "api body" })
	createTopic(@Body() body: CreateTopicDto, @Request() request) {
		return this.topicService.createTopic(body, request);
	}

  @Post("postLogin/updateCustomTopic")
	@ApiOperation({ summary: "Update Topic" })
	@ApiBearerAuth("authorization")
	@ApiHeader({ name: "authorization", description: "token", required: true })
	@ApiResponse({
		status: 200,
		description: "Update Topic",
		type: ""
	})
	@ApiBody({ type: UpdateTopicDto, description: "api body" })
	updateTopic(@Body() updateTopicDto: UpdateTopicDto, @Request() request) {
		return this.topicService.updateTopic(updateTopicDto, request);
	}

  @Post("postLogin/deleteCustomTopic")
	@ApiOperation({ summary: "Delete Topic" })
	@ApiBearerAuth("authorization")
	@ApiHeader({ name: "authorization", description: "token", required: true })
	@ApiResponse({
		status: 200,
		description: "Delete Topic",
		type: ""
	})
	@ApiBody({ type: DeleteTopicDto, description: "api body" })
	deleteTopic(@Body() body: DeleteTopicDto, @Request() request) {
		return this.topicService.deleteTopic(body, request);
	}

}
