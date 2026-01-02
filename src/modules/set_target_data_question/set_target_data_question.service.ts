import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ExternalApiCallService } from '@utils/common/external-api-call/external-api-call.service';
import { UserDaoService } from '@modules/dao/setting/user-dao/user-dao.service';
import { ReportingModuleDaoService } from '@modules/dao/reporting-module-dao/reporting-module-dao.service';
import { CreateSetTargetDataQuestionDto } from './dto/create-set_target_data_question.dto';
import { SetTargetDataQuestionDaoService } from '@modules/dao/set_target_data_question-dao/set_target_data_question-dao.service';
import { ReportingQuestionTargetDataEntity } from './entities/set_target_data_question.entity';
import { QuestionType } from '@utils/enums/Status';

@Injectable()
export class SetTargetDataQuestionService {
  constructor(private externalApiCallService: ExternalApiCallService, private userDaoService: UserDaoService, private reportingModuleDaoService: ReportingModuleDaoService, private setTargetDataQuestionDaoService: SetTargetDataQuestionDaoService
  ) { }

  async getSetTargetQuestion(req: any) {
    const systemUserId = req.headers.userid;
    const getCompany = await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId);
    const frameworkIds = (await this.externalApiCallService.getReq(
      process.env.COMPANY_SERVER_API_URL + 'getFramework', { companyId: getCompany.company_id, type: 'ALL', user_type_code: 'company' }, {},
    )).data.map((obj) => obj.id);

    const queryParam = {
      company_id: getCompany.company_id,
      user_type_code: 'COMPANY',
      framework_ids: frameworkIds,
      qIds: undefined,
    };

    const getSectorQuestion = await this.externalApiCallService.getReq(
      process.env.COMPANY_SERVER_API_URL + 'getTriggerQuestion',
      queryParam,
      {},
    );

    let mainQuestions = getSectorQuestion.data;

    const modules = mainQuestions.reduce((acc, question) => {
      const { moduleId, moduleName } = question;

      if (!acc[moduleName]) {
        acc[moduleName] = {
          id: moduleId, // Renamed moduleId to id
          title: moduleName, // Renamed moduleName to title
          questions: [],
        };
      }

      acc[moduleName].questions.push(question);

      return acc;
    }, {});


    const modulesArray = Object.values(modules);
    if (modulesArray.length) {
      throw new HttpException(
        { status: 200, message: 'Data Found', data: modulesArray },
        HttpStatus.OK,
      );
    } else {
      throw new HttpException({ status: 400, message: 'No active plan found!' }, HttpStatus.CONFLICT);
    }
  }

  async saveSetTargetQuestion(createSetTargetDataQuestionDto: CreateSetTargetDataQuestionDto, req: any) {
    // const systemUserId = req.headers.userid;
    // const { financialYearId, questionId, questionType, answer, sourceId, fromDate, toDate, questionTitle, unit } = createSetTargetDataQuestionDto;
    // const companyId = (await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId)).company_id;
    // const existingRecord = await this.setTargetDataQuestionDaoService.ReportingQuestionTargetDataEntity(financialYearId, questionId, sourceId, fromDate, toDate);
    // if (existingRecord) {
    //   const answerEntity = this.createSetTargetAnswerEntity(systemUserId, financialYearId, questionId, questionType as QuestionType, questionTitle, sourceId, fromDate, toDate, answer, unit, companyId);
    //   await this.setTargetDataQuestionDaoService.updateReportingQuestionAnswerTargetFor(financialYearId, questionId, answerEntity);
    // } else if (existingRecord === null) {
    //   const answerEntity = this.createSetTargetAnswerEntity(systemUserId, financialYearId, questionId, questionType as QuestionType, questionTitle, sourceId, fromDate, toDate, answer, unit, companyId);
    //   const insertAnswer = await this.setTargetDataQuestionDaoService.saveReportingQuestionTargetAnswer(answerEntity);
    // }
    // throw new HttpException({ status: 200, message: 'Target Saved', answers: answer }, HttpStatus.OK);
  }

  async saveTriggerData(createSetTargetDataQuestionDto: CreateSetTargetDataQuestionDto, req: any) {
    const systemUserId = req.headers.userid;
    const { financialYearId, questionId, questionType, minTrigger, maxTrigger, sourceId, fromDate, toDate, questionTitle, unit,columnId,rowId } = createSetTargetDataQuestionDto;
    const companyId = (await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId)).company_id;
    const existingRecord = questionType === 'tabular_question'? await this.setTargetDataQuestionDaoService.ReportingQuestionTabularTargetDataEntity(financialYearId, questionId, sourceId, fromDate, toDate,columnId,rowId)
    :await this.setTargetDataQuestionDaoService.ReportingQuestionTargetDataEntity(financialYearId, questionId, sourceId, fromDate, toDate);
    if (existingRecord) {
      const answerEntity = this.createSetTargetAnswerEntity(systemUserId, financialYearId, questionId, questionType as QuestionType, questionTitle, sourceId, fromDate, toDate, minTrigger, maxTrigger, unit,columnId,rowId, companyId);
      await this.setTargetDataQuestionDaoService.updateReportingQuestionAnswerTargetFor(financialYearId, questionId,fromDate, toDate, sourceId, columnId, rowId, answerEntity);
    } else if (existingRecord === null) {
      const answerEntity = this.createSetTargetAnswerEntity(systemUserId, financialYearId, questionId, questionType as QuestionType, questionTitle, sourceId, fromDate, toDate, minTrigger, maxTrigger, unit,columnId,rowId, companyId);
      const insertAnswer = await this.setTargetDataQuestionDaoService.saveReportingQuestionTargetAnswer(answerEntity);
    }
    throw new HttpException({ status: 200, message: 'Target Saved' }, HttpStatus.OK);
  }

  async getTargetQuestionAnswer(req: any) {
    const { financialYearId } = req.query;
    if (!financialYearId) {
      throw new HttpException({ status: 400, message: 'Finanacial year required', answers: [] }, HttpStatus.CONFLICT);
    }
    const reportingAnswer = await this.setTargetDataQuestionDaoService.getTargetQuestionAnswer(Number(financialYearId));
    throw new HttpException({ status: 200, message: 'Data Found', answers: reportingAnswer }, HttpStatus.OK);
  }

  async getTargerAnswer(req: any) {
    const { financialYearId, questionId } = req.query;
    if (!financialYearId) {
      throw new HttpException({ status: 400, message: 'Finanacial year required', answers: [] }, HttpStatus.CONFLICT);
    }
    const reportingAnswer = [];
    throw new HttpException({ status: 200, message: 'Data Found', answers: reportingAnswer }, HttpStatus.OK);
  }

  async getTriggerValues(req: any) {
    const { financialYearId, sourceId,questionId,fromDate } = req.query;
    if (!financialYearId) {
      throw new HttpException({ status: 400, message: 'Finanacial year required', data: [] }, HttpStatus.CONFLICT);
    }
    const reportingAnswer = await this.setTargetDataQuestionDaoService.getTargetQuestionsAnswer(Number(financialYearId), Number(sourceId),questionId,fromDate);
    throw new HttpException({ status: 200, message: 'Data Found', data: reportingAnswer }, HttpStatus.OK);
  }

  

  private createSetTargetAnswerEntity(systemUserId: any, financialYearId: number, questionId: number, questionType: QuestionType, questionTitle: string, sourceId: number, fromDate: string, toDate: string,
    minTargetData: string, maxTargetData: string, unit: string, columnId:number,rowId:number,companyId: number): ReportingQuestionTargetDataEntity {
    return new ReportingQuestionTargetDataEntity(
      systemUserId, financialYearId, questionId, questionTitle, minTargetData, maxTargetData, questionType, sourceId, null, fromDate, toDate, true, unit,columnId,rowId, companyId
    );
  }

}
