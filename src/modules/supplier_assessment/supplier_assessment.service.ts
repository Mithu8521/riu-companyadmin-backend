import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { UserDaoService } from '@modules/dao/setting/user-dao/user-dao.service';
import { SupplierAssessmentEntity } from './entities/supplier_assessment.entity';
import { CreateSupplierAssessmentDto } from './dto/create-supplier_assessment.dto';
import { UpdateSupplierAssessmentDto } from './dto/update-supplier_assessment.dto';
import { DeleteSupplierAssessmentDto } from './dto/delete-supplier_assessment.dto';
import { SupplierAssessmentDaoService } from '@modules/dao/supplier-assessment-dao/supplier-assessment-dao.service';
import { CreateAssesmentQuestionDto } from './dto/create-assessment_question.dto';
import { AssessmentQuestionEntity } from './entities/create_assessment_question.entity';
import { AssessmentQuestionDetailsEntity } from './entities/assessment_question_details.entity';
import { DeleteAssessmentQuestionDto } from './dto/delete-assassment-question.dto';
import { UpdateAssessmentQuestionDto } from './dto/update-assessment-question.dto';
import { AssignSupplierAssessmentDto } from './dto/assign-assesment_question.dto';
import { ExternalApiCallService } from '@utils/common/external-api-call/external-api-call.service';
import { PlateformAdminType, PlateformType } from '@utils/enums/Status';
@Injectable()
export class SupplierAssessmentService {
  constructor(private supplierAssessmentDaoService: SupplierAssessmentDaoService, private userDaoService: UserDaoService, private externalApiCallService: ExternalApiCallService) { }

  async getSupplierAssessment(req: any) {
    const systemUserId = req.headers.userid;
    const companyId = (await this.userDaoService.getCompanyDetailsBasedOnUserId(Number(systemUserId))).company_id;
    const assesmentData = await this.supplierAssessmentDaoService.getAllAssesment(companyId);
    if (assesmentData) {
      throw new HttpException({ status: 200, message: 'Data Found', data: assesmentData, }, HttpStatus.OK);
    }
  }

  async createSupplierAssessment(body: CreateSupplierAssessmentDto, req: any) {
    const systemUserId = req.headers.userid;
    const companyId = (await this.userDaoService.getCompanyDetailsBasedOnUserId(Number(systemUserId))).company_id;
    const { title, financialYearId } = body;
    let { questionIds } = body;
    if (req.body.mode === "ByFrameworks") {
      questionIds = [];
      const questionData = req.body.questionData;
      for (let element of questionData) {
        const insertedData = await this.supplierAssessmentDaoService.insertAssessmentQuestion(new AssessmentQuestionEntity(companyId, financialYearId, element.questionType, element?.id, "supplier" as PlateformType, element?.graphApplicable,
          element?.isDependent, element.heading, element.title, element?.readingValue, "SUPER_ADMIN" as PlateformAdminType, systemUserId, true));
        questionIds.push(insertedData.id)
        if (element.question_detail != null && element.question_detail.length) {
          let arr = [];
          for (var ele in element.question_detail) {
            let obj1 = new AssessmentQuestionDetailsEntity(insertedData.id, element.question_detail[ele].option_type, element.question_detail[ele].option, '', systemUserId);
            arr.push(obj1);
          }
          await this.supplierAssessmentDaoService.insertAssessmentQuestionDetails(arr);
        }
      }
    }
    const inserted = await this.supplierAssessmentDaoService.insertAssessment(new SupplierAssessmentEntity(title, financialYearId, JSON.stringify(questionIds), JSON.stringify([]), true, true, true, companyId));
    if (inserted) {
      throw new HttpException({ status: 200, message: 'Created successfully', }, HttpStatus.OK);
    } else {
      throw new HttpException({ status: 400, message: 'Something went wrong', }, HttpStatus.CONFLICT);
    }
  }

  async updateSupplierAssessment(body: UpdateSupplierAssessmentDto, req: any) {
    const { assessmentId, title, financialYearId, questionIds } = body;
    const assessmentData = await this.supplierAssessmentDaoService.getAllAssesmentBasedOnId(assessmentId);
    if (assessmentData) {
      const updatedFields: { title?: string, finanacialYearId?: number, questionIds?: string } = {};
      if (title !== '' && title !== assessmentData.title) {
        updatedFields.title = title;
      }
      if (financialYearId !== 0 && financialYearId !== undefined && financialYearId !== assessmentData.financialYearId) {
        updatedFields.finanacialYearId = financialYearId;
      }
      if (questionIds.length && questionIds !== undefined && JSON.stringify(questionIds) !== assessmentData.questionIds) {
        updatedFields.questionIds = JSON.parse(assessmentData.questionIds)
        const mergedQuestionIds = [...updatedFields.questionIds, ...questionIds];
        updatedFields.questionIds = JSON.stringify(mergedQuestionIds);
      }
      if (Object.keys(updatedFields).length > 0) {
        const updateAssessment = await this.supplierAssessmentDaoService.updateAssessment(assessmentId, updatedFields);
        if (updateAssessment) {
          throw new HttpException({ status: 200, message: 'Updated successfully' }, HttpStatus.OK);
        } else {
          throw new HttpException({ status: 404, message: 'Assessment not found' }, HttpStatus.NOT_FOUND);
        }
      } else {
        throw new HttpException({ status: 400, message: 'No changes detected' }, HttpStatus.BAD_REQUEST);
      }
    }
  }

  async assignAssessment(body: AssignSupplierAssessmentDto, req: any) {
    const { assessmentId, userIds } = body;
    const assessmentData = await this.supplierAssessmentDaoService.getAllAssesmentBasedOnId(assessmentId);
    if (assessmentData) {
      let updatedUserIds: number[] = [];
      if (assessmentData.userIds) { updatedUserIds = JSON.parse(assessmentData.userIds) }
      if (userIds !== undefined && JSON.stringify(userIds) !== assessmentData.userIds) {
        updatedUserIds = [...updatedUserIds, ...userIds];
      }
      const updatedUserIdsString = JSON.stringify(updatedUserIds);
      const updateAssessment = await this.supplierAssessmentDaoService.assignAssessmentToUser(assessmentId, updatedUserIdsString);
      if (updateAssessment) {
        throw new HttpException({ status: 200, message: 'Assigned User successfully' }, HttpStatus.OK);
      } else {
        throw new HttpException({ status: 404, message: 'Assessment not found' }, HttpStatus.NOT_FOUND);
      }
    } else {
      throw new HttpException({ status: 400, message: 'No changes detected' }, HttpStatus.BAD_REQUEST);
    }

  }

  async deleteSupplierAssessment(body: DeleteSupplierAssessmentDto, req: any) {
    const { assessmentId } = body;
    const deletedData = await this.supplierAssessmentDaoService.deleteAssessment(assessmentId);
    if (deletedData) {
      throw new HttpException({ status: 200, message: 'Deleted successfully', }, HttpStatus.OK,);
    } else { throw new HttpException({ status: 404, message: 'Supplier Assessment not found', }, HttpStatus.NOT_FOUND,); }
  }

  async getAssessmentQuestion(req: any) {
    const { financialYearId, questionIds } = req.query;
    const getSectorQuestionDetailsDeatls = questionIds !== 'undefined' ? await this.supplierAssessmentDaoService.getAssessmentQuestionBasedIds(JSON.parse(questionIds)) : await this.supplierAssessmentDaoService.getAssessmentQuestion(financialYearId);
    const questionDetails: any[] = [];
    for (const assessmentQuestionDetails of getSectorQuestionDetailsDeatls) {
      const { id } = assessmentQuestionDetails;
      const showTableDetails = await this.supplierAssessmentDaoService.getAssessmentQuestionDetails(id);
      assessmentQuestionDetails.question_detail = showTableDetails;
      questionDetails.push({ ...assessmentQuestionDetails });
    }
    throw new HttpException({ status: 200, message: 'Data Found', data: questionDetails }, HttpStatus.OK);
  }

  async updateAssessmentQuestion(body: UpdateAssessmentQuestionDto, req: any) {

  }

  async deleteAssessmentQuestion(body: DeleteAssessmentQuestionDto, req: any,) {
    const { questionId } = body;
    const deletedData = await this.supplierAssessmentDaoService.deleteAssessmentQuestion(questionId);
    const deletedQuestionDetils = await this.supplierAssessmentDaoService.deleteAssessmentQuestionDeatis(questionId);
    if (deletedData) {
      throw new HttpException({ status: 200, message: 'Deleted successfully', }, HttpStatus.OK,);
    } else { throw new HttpException({ status: 404, message: 'Assessment Question not found', }, HttpStatus.NOT_FOUND,); }
  }

  async createAssessmentQuestion(body: CreateAssesmentQuestionDto, req: any) {
    const systemUserId = req.headers.userid;
    const { financialYearId, entity, questions } = body;
    const companyId = (await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId)).company_id;
    if (!companyId) { throw new HttpException({ status: 400, message: 'Invalid Company', }, HttpStatus.CONFLICT,) }
    for (let element of JSON.parse(questions)) {
      if (!element.questionType || !element.questionHeading || !element.questionTitle) {
        throw new HttpException({ status: 400, message: 'Question Type , Question Heading , Question Title is mendatory!', }, HttpStatus.CONFLICT,);
      }

      if (element.questionType == 'tabular_question') {
        if (!element?.graphApplicable) {
          throw new HttpException({ status: 400, message: 'Graph Applicable Mendatory' }, HttpStatus.CONFLICT,);
        }
      }
      // let isExist = await checkQuestionAlreadyExist(element, company_id); please do latter
    }
    for (let element of JSON.parse(questions)) {
      const insertedData = await this.supplierAssessmentDaoService.insertAssessmentQuestion(new AssessmentQuestionEntity(companyId, financialYearId, element.questionType, null, entity, element.graphApplicable,
        element.isDependent, element.questionHeading, element.questionTitle, element.readingValue, "COMPANY_ADMIN" as PlateformAdminType, systemUserId, true));
      if (element.question_detail != null && element.question_detail) {
        let arr = [];
        for (var ele in element.question_detail) {
          element.question_detail[ele].forEach((value) => {
            let obj1 = new AssessmentQuestionDetailsEntity(insertedData.id, ele, value, '', systemUserId);
            arr.push(obj1);
          });
        }
        await this.supplierAssessmentDaoService.insertAssessmentQuestionDetails(arr);
      }
    }
    throw new HttpException({ status: 200, message: 'Created successfully', }, HttpStatus.OK);
  }

  async getFrameworkQuestion(req: any) {
    const systemUserId = req.headers.userid;
    const { frameworkIds, topicIds, financialYearId } = req.query;
    const companyId = (await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId)).company_id;
    const queryParam = {
      companyId: companyId, type: req.query.type, user_type_code: 'company', entity: 'company', framework_ids: frameworkIds,
      topic_ids: topicIds, financial_year_id: Number(financialYearId), questionnaire_type: "SQ", kpi_ids: JSON.stringify([]), qIds: undefined,
    };
    const getSectorQuestion = await this.externalApiCallService.getReq(
      process.env.COMPANY_SERVER_API_URL + 'getSectorQuestion',
      queryParam,
      {},
    );
    if (getSectorQuestion.data.length) {
      throw new HttpException({ status: 200, message: 'Data Found', data: getSectorQuestion.data }, HttpStatus.OK,);
    } else {
      throw new HttpException({ status: 400, message: 'No active plan found!' }, HttpStatus.CONFLICT);
    }
  }
}
