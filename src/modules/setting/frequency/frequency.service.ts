import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ExternalApiCallService } from '@utils/common/external-api-call/external-api-call.service';
import { UserDaoService } from '@modules/dao/setting/user-dao/user-dao.service';
import { AnswerFrequencyDaoService } from '@modules/dao/setting/answer-frequency-dao/answer-frequency-dao.service';
import { UpdateFrequencyDto } from './dto/create-frequency.dto';
import { AnswerFrequency } from '@utils/enums/Status';
import { UserActivityLog } from '../user/entities/user_activity_logs';

@Injectable()
export class FrequencyService {
  constructor(private answerFrequencyDaoService: AnswerFrequencyDaoService, private userDaoService: UserDaoService, private externalApiCallService: ExternalApiCallService) { }

  async getOldFrequencyModule(req: any) {
    const systemUserId = req.headers.userid;
    const getCompany = await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId);

    const frameworkIds = getCompany.parent_id
      ? (await this.externalApiCallService.getReq(
        process.env.COMPANY_SERVER_API_URL + 'getFramework',
        { companyId: getCompany.company_id, type: 'ALL', user_type_code: 'company' },
        {},
      )).data.map((obj) => obj.id) : req.query.frameworkIds;

    const queryParam = { company_id: getCompany.company_id, user_type_code: 'COMPANY', framework_ids: frameworkIds };
    const getSectorQuestion = await this.externalApiCallService.getReq(
      process.env.COMPANY_SERVER_API_URL + 'getReportingQuestion',
      queryParam,
      {},
    );
    const modules = await this.answerFrequencyDaoService.getAnswerFrequency(Number(req.query.financialYearId));
    let mainQuestions = getSectorQuestion.data;
    const uniqueModules = [];
    const seenModules = new Set();

    mainQuestions.forEach(item => {
      const moduleIdentifier = `${item.moduleId}-${item.moduleName}`;
      if (!seenModules.has(moduleIdentifier)) {
        seenModules.add(moduleIdentifier);

        const matchedModule = modules.find(module => module.moduleId == item.moduleId);
        const frequencies = matchedModule ? matchedModule.frequency : [];

        uniqueModules.push({
          moduleId: item.moduleId,
          moduleName: item.moduleName,
          frequencies
        });
      }
    });
    throw new HttpException({ status: 200, massage: 'Data Found', data: uniqueModules }, HttpStatus.OK);
  }

  async getFrequencyModule(req: any) {
    const systemUserId = req.headers.userid;
    const getCompany = await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId);
    let queryParam = { userId: getCompany.company_id, type: 'COMPANY', };
    const financialYearData = (await this.externalApiCallService.getReq(process.env.COMPANY_SERVER_API_URL + 'getFinancialYear', queryParam, {},)).data;
    const uniqueModules = [];
    for (let i = 0; i < financialYearData.length; i++) {
      const modules = await this.answerFrequencyDaoService.getAnswerFrequency(Number(financialYearData[i].id));
      uniqueModules.push({
        moduleId: financialYearData[i].id,
        moduleName: financialYearData[i].financial_year_value,
        frequencies: modules && modules.length ? modules[0].frequency : null
      });
    }

    throw new HttpException({ status: 200, massage: 'Data Found', data: uniqueModules }, HttpStatus.OK);
  }

  async getFrequency(req: any) {
    const modules = await this.answerFrequencyDaoService.getAnswerFrequency(Number(req.query.financialYearId));  
    throw new HttpException({ status: 200, massage: 'Data Found', data: modules&&modules.length ? modules[0].frequency : 'YEARLY' }, HttpStatus.OK);
  }

  async saveFrequencyModule(body: UpdateFrequencyDto, req: any) {
    const { financialYearId, moduleId, frequency } = body;
    const systemUserId = req.headers.userid;
    const systemUserInfo = await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId);

    const answerFrequency: AnswerFrequency = frequency as AnswerFrequency;
    const updatedData = await this.answerFrequencyDaoService.updateFreaquencyStatus(financialYearId, answerFrequency);  
    const activityLog = UserActivityLog.createLog(
      `Frequency updated to ${frequency}`,
      'Frequency Update',
      'success',
      systemUserId,
      systemUserId,
      {
        questionId: null,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        location: null,
        viewableChanges: null,
        metadata: {
          // Standard fields always present
          name: `${systemUserInfo.first_name || ''} ${systemUserInfo.last_name || ''}`.trim(),
          email: systemUserInfo.email,
          updated_time: new Date().toISOString()
        }
      }
    );
    
    // Save the activity log
    await this.userDaoService.insertTodaysActivityData(activityLog);  
    throw new HttpException({ status: 200, message: 'Updated successfully' }, HttpStatus.OK);
  } 

}
