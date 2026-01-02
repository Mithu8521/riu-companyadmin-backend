import { Controller, Get, Post, Body, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { VerifyTokenGuard } from '@utils/guards/verify-token/verify-token.guards';
import { SupplierAssessmentService } from './supplier_assessment.service';
import { CreateSupplierAssessmentDto } from './dto/create-supplier_assessment.dto';
import { UpdateSupplierAssessmentDto } from './dto/update-supplier_assessment.dto';
import { DeleteSupplierAssessmentDto } from './dto/delete-supplier_assessment.dto';
import { UpdateAssessmentQuestionDto } from './dto/update-assessment-question.dto';
import { DeleteAssessmentQuestionDto } from './dto/delete-assassment-question.dto';
import { CreateAssesmentQuestionDto } from './dto/create-assessment_question.dto';
import { AssignSupplierAssessmentDto } from './dto/assign-assesment_question.dto';
@UseGuards(VerifyTokenGuard)
@ApiTags('Supplier Assessment')
@Controller('v1.0')
export class SupplierAssessmentController {
	constructor(private readonly supplierAssessmentService: SupplierAssessmentService) { }

	@Get("postLogin/getSupplierAssessment")
	@ApiOperation({ summary: "Get Supplier Assessment" })
	@ApiBearerAuth("authorization")
	@ApiHeader({ name: "authorization", description: "token", required: true })
	@ApiResponse({ status: 200, description: "Get Supplier Assessment", type: "" })
	getSupplierAssessment(@Request() request) {
		return this.supplierAssessmentService.getSupplierAssessment(request);
	}

	@Post("postLogin/createSupplierAssessment")
	@ApiOperation({ summary: "Create Supplier Assessment" })
	@ApiBearerAuth("authorization")
	@ApiHeader({ name: "authorization", description: "token", required: true })
	@ApiResponse({ status: 200, description: "Create Supplier Assessment", type: "" })
	@ApiBody({ type: CreateSupplierAssessmentDto, description: "api body" })
	createSupplierAssessment(@Body() body: CreateSupplierAssessmentDto, @Request() request) {
		return this.supplierAssessmentService.createSupplierAssessment(body, request);
	}

	@Post("postLogin/assignAssessment")
	@ApiOperation({ summary: "Assign Supplier Assessment" })
	@ApiBearerAuth("authorization")
	@ApiHeader({ name: "authorization", description: "token", required: true })
	@ApiResponse({ status: 200, description: "Assign Supplier Assessment", type: "" })
	@ApiBody({ type: AssignSupplierAssessmentDto, description: "api body" })
	assignAssessment(@Body() body: AssignSupplierAssessmentDto, @Request() request) {
		return this.supplierAssessmentService.assignAssessment(body, request);
	}

	@Post("postLogin/updateSupplierAssessment")
	@ApiOperation({ summary: "Update Supplier Assessment" })
	@ApiBearerAuth("authorization")
	@ApiHeader({ name: "authorization", description: "token", required: true })
	@ApiResponse({ status: 200, description: "Update Supplier Assessment", type: "" })
	@ApiBody({ type: UpdateSupplierAssessmentDto, description: "api body" })
	updateSupplierAssessment(@Body() body: UpdateSupplierAssessmentDto, @Request() request) {
		return this.supplierAssessmentService.updateSupplierAssessment(body, request);
	}

	@Post("postLogin/deleteSupplierAssessment")
	@ApiOperation({ summary: "Delete Supplier Assessment" })
	@ApiBearerAuth("authorization")
	@ApiHeader({ name: "authorization", description: "token", required: true })
	@ApiResponse({ status: 200, description: "Update Supplier Assessment", type: "" })
	@ApiBody({ type: DeleteSupplierAssessmentDto, description: "api body" })
	deleteSupplierAssessment(@Body() body: DeleteSupplierAssessmentDto, @Request() request) {
		return this.supplierAssessmentService.deleteSupplierAssessment(body, request);
	}

	@Get("postLogin/getAssessmentQuestion")
	@ApiOperation({ summary: "Get Supplier Assessment Question" })
	@ApiBearerAuth("authorization")
	@ApiHeader({ name: "authorization", description: "token", required: true })
	@ApiResponse({ status: 200, description: "Get Supplier Assessment Question", type: "" })
	getAssessmentQuestion(@Request() request) {
		return this.supplierAssessmentService.getAssessmentQuestion(request);
	}

	@Post("postLogin/createAssessmentQuestion")
	@ApiOperation({ summary: "Create Supplier Assessment Question" })
	@ApiBearerAuth("authorization")
	@ApiHeader({ name: "authorization", description: "token", required: true })
	@ApiResponse({ status: 200, description: "Create Supplier Assessment Question", type: "" })
	@ApiBody({ type: CreateAssesmentQuestionDto, description: "api body" })
	createAssessmentQuestion(@Body() body: CreateAssesmentQuestionDto, @Request() request) {
		return this.supplierAssessmentService.createAssessmentQuestion(body, request);
	}

	@Post("postLogin/updateAssessmentQuestion")
	@ApiOperation({ summary: "Update Supplier Assessment Question" })
	@ApiBearerAuth("authorization")
	@ApiHeader({ name: "authorization", description: "token", required: true })
	@ApiResponse({ status: 200, description: "Update Supplier Assessment Question", type: "" })
	@ApiBody({ type: UpdateAssessmentQuestionDto, description: "api body" })
	updateAssessmentQuestion(@Body() body: UpdateAssessmentQuestionDto, @Request() request) {
		return this.supplierAssessmentService.updateAssessmentQuestion(body, request);
	}

	@Post("postLogin/deleteAssessmentQuestion")
	@ApiOperation({ summary: "Delete Supplier Assessment" })
	@ApiBearerAuth("authorization")
	@ApiHeader({ name: "authorization", description: "token", required: true })
	@ApiResponse({ status: 200, description: "Update Supplier Assessment Question", type: "" })
	@ApiBody({ type: DeleteAssessmentQuestionDto, description: "api body" })
	deleteAssessmentQuestion(@Body() body: DeleteAssessmentQuestionDto, @Request() request) {
		return this.supplierAssessmentService.deleteAssessmentQuestion(body, request);
	}

	@Get("postLogin/getFrameworkQuestion")
	@ApiOperation({ summary: "Get FrameworkQuestion" })
	@ApiBearerAuth("authorization")
	@ApiHeader({ name: "authorization", description: "token", required: true })
	@ApiResponse({ status: 200, description: "Get Framework Question", type: "" })
	getFrameworkQuestion(@Request() request) {
		return this.supplierAssessmentService.getFrameworkQuestion(request);
	}
}



