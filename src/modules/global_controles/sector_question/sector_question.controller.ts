import { Controller, Get, Post, Body, Query, Request, UseGuards } from '@nestjs/common';
import { SectorQuestionService } from './sector_question.service';
import { ApiBearerAuth, ApiBody, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetSectorQuestionDto } from './dto/get-sector_question.dto';
import { CreateSectorQuestionDto } from './dto/create-sector_question.dto';
import { UpdateSectorQuestionDto } from './dto/update-sector_question.dto';
import { DeleteSectorQuestionDto } from './dto/delete-sector_question.dto';
import { VerifyTokenGuard } from '@utils/guards/verify-token/verify-token.guards';

@UseGuards(VerifyTokenGuard)
@ApiTags('Global Controles : Sector Question')
@Controller('v1.0')
export class SectorQuestionController {
  constructor(private readonly sectorQuestionService: SectorQuestionService) {}

  @Get("postLogin/getCustomSectorQuestion")
	@ApiOperation({ summary: "Get Sector Question" })
	@ApiBearerAuth("authorization")
	@ApiHeader({ name: "authorization", description: "token", required: true })
	@ApiResponse({
		status: 200,
		description: "Get Sector Question",
		type: ""
	})
	getSectorQuestion( @Request() request) {
		return this.sectorQuestionService.getSectorQuestion( request);
	}

	@Post("postLogin/createCustomSectorQuestion")
	@ApiOperation({ summary: "Create Sector Question" })
	@ApiBearerAuth("authorization")
	@ApiHeader({ name: "authorization", description: "token", required: true })
	@ApiResponse({
		status: 200,
		description: "Create Sector Question",
		type: ""
	})
	@ApiBody({ type: CreateSectorQuestionDto, description: "api body" })
	createSectorQuestion(@Body() body: CreateSectorQuestionDto, @Request() request) {
		return this.sectorQuestionService.createSectorQuestion(body, request);
	}

  @Post("postLogin/updateCustomSectorQuestion")
	@ApiOperation({ summary: "Update SectorQuestion" })
	@ApiBearerAuth("authorization")
	@ApiHeader({ name: "authorization", description: "token", required: true })
	@ApiResponse({
		status: 200,
		description: "Update SectorQuestion",
		type: ""
	})
	@ApiBody({ type: UpdateSectorQuestionDto, description: "api body" })
	updateSectorQuestion(@Body() updateSectorQuestionDto: UpdateSectorQuestionDto, @Request() request) {
		return this.sectorQuestionService.updateSectorQuestion(updateSectorQuestionDto, request);
	}

  @Post("postLogin/deleteCustomSectorQuestion")
	@ApiOperation({ summary: "Delete SectorQuestion" })
	@ApiBearerAuth("authorization")
	@ApiHeader({ name: "authorization", description: "token", required: true })
	@ApiResponse({
		status: 200,
		description: "Delete SectorQuestion",
		type: ""
	})
	@ApiBody({ type: DeleteSectorQuestionDto, description: "api body" })
	deleteSectorQuestion(@Body() body: DeleteSectorQuestionDto, @Request() request) {
		return this.sectorQuestionService.deleteSectorQuestion(body, request);
	}
}
