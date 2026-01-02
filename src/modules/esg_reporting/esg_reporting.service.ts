import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateEsgReportingDto } from './dto/create-esg_reporting.dto';
import { UpdateEsgReportingDto } from './dto/update-esg_reporting.dto';
import { ExternalApiCallService } from '@utils/common/external-api-call/external-api-call.service';
import { UserDaoService } from '@modules/dao/setting/user-dao/user-dao.service';
import { EsgReportingDaoService } from '@modules/dao/esg-reporting-dao/esg-reporting-dao.service';
import { EsgReportingEntity } from './entities/esg_reporting.entity';

@Injectable()
export class EsgReportingService {
  constructor(
    private externalApiCallService: ExternalApiCallService,
    private userDaoService: UserDaoService,
    private esgReportingDaoService: EsgReportingDaoService,
  ) { }

  async getFinancialYear(req: any) {
    const systemUserId = req.headers.userid;
    const getCompany =
      await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId);
    let queryParam = {
      userId: getCompany.company_id,
      type: 'COMPANY',
    };
    const financialYearData = await this.externalApiCallService.getReq(
      process.env.COMPANY_SERVER_API_URL + 'getFinancialYear',
      queryParam,
      {},
    );

    if (financialYearData.data.length) {
      throw new HttpException(
        {
          status: 200,
          message: 'Data Found',
          data: financialYearData.data,
        },
        HttpStatus.OK,
      );
    } else {
      throw new HttpException(
        {
          status: 400,
          message: 'No active plan found!',
        },
        HttpStatus.CONFLICT,
      );
    }
  }

  async getFramework(req: any) {
    const systemUserId = req.headers.userid;
    const getCompany =
      await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId);
    let queryParam = {
      companyId: getCompany.company_id,
      type: req.query.type || "ALL",
      user_type_code: 'company',
    };
    const getFramework = await this.externalApiCallService.getReq(
      process.env.COMPANY_SERVER_API_URL + 'getFramework',
      queryParam,
      {},
    );

    if (getFramework.data.length) {
      throw new HttpException(
        {
          status: 200,
          message: 'Data Found',
          data: getFramework.data,
        },
        HttpStatus.OK,
      );
    } else {
      throw new HttpException(
        {
          status: 400,
          message: 'No active plan found!',
        },
        HttpStatus.CONFLICT,
      );
    }
  }

  async getTopic(req: any) {
    if (!req.query.frameworkIds) {
      throw new HttpException(
        {
          status: 400,
          message: 'framwork ID required',
        },
        HttpStatus.CONFLICT,
      );
    }
    if (!req.query.type) {
      throw new HttpException(
        {
          status: 400,
          message: 'type required',
        },
        HttpStatus.CONFLICT,
      );
    }
    const systemUserId = req.headers.userid;
    const getCompany =
      await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId);
    let queryParam = {
      companyId: getCompany.company_id,
      type: req.query.type,
      user_type_code: 'company',
      framework_ids: req.query.frameworkIds,
    };
    const getTopic = await this.externalApiCallService.getReq(
      process.env.COMPANY_SERVER_API_URL + 'getTopic',
      queryParam,
      {},
    );

    if (getTopic.data) {
      throw new HttpException(
        {
          status: 200,
          message: 'Data Found',
          data: getTopic.data,
        },
        HttpStatus.OK,
      );
    } else {
      throw new HttpException(
        {
          status: 400,
          message: 'No active plan found!',
        },
        HttpStatus.CONFLICT,
      );
    }
  }

  async getKpi(req: any) {
    if (!req.query.type) {
      throw new HttpException(
        {
          status: 400,
          message: 'type required',
        },
        HttpStatus.CONFLICT,
      );
    }
    const { voluntaryTopicsId, mandatoryTopicsId } = req.query;
    const systemUserId = req.headers.userid;
    const getCompany =
      await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId);
    let queryParam = {
      companyId: getCompany.company_id,
      type: req.query.type,
      user_type_code: 'company',
      topic_ids: JSON.parse(mandatoryTopicsId),
    };
    const getMandatoryKpi = await this.externalApiCallService.getReq(
      process.env.COMPANY_SERVER_API_URL + 'getKpi',
      queryParam,
      {},
    );
    let getValKpi: any[] = [];

    if (voluntaryTopicsId && voluntaryTopicsId.length === 0) {
      let valQueryParam = {
        companyId: getCompany.company_id,
        type: req.query.type,
        user_type_code: 'company',
        topic_ids: JSON.parse(voluntaryTopicsId),
      };

      const response = await this.externalApiCallService.getReq(
        process.env.COMPANY_SERVER_API_URL + 'getKpi',
        valQueryParam,
        {},
      );

      getValKpi = response.data || [];
    }

    const kpiData: {
      mandatoryKpi: any[];
      voluntaryKpi: any[];
      customKpi: any[];
    } = {
      mandatoryKpi: getMandatoryKpi.data || [],
      voluntaryKpi: getValKpi,
      customKpi: [],
    };

    if (getMandatoryKpi.data) {
      throw new HttpException(
        {
          status: 200,
          message: 'Data Found',
          data: kpiData,
        },
        HttpStatus.OK,
      );
    } else {
      throw new HttpException(
        {
          status: 400,
          message: 'No active plan found!',
        },
        HttpStatus.CONFLICT,
      );
    }
  }

  async getESGReport(req: any) {
    if (!req.query.financial_year_id) {
      throw new HttpException(
        {
          status: 400,
          message: 'financial_year ID required',
        },
        HttpStatus.CONFLICT,
      );
    }
    if (!req.query.type) {
      throw new HttpException(
        {
          status: 400,
          message: 'type required',
        },
        HttpStatus.CONFLICT,
      );
    }
    const systemUserId = req.headers.userid;

    const getESGReport =
      await this.esgReportingDaoService.getEsgReportingBasedOnUserId(
        systemUserId,
      );
    const getCompany =
      await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId);
    if (!getESGReport.length) {
      let queryParam = {
        companyId: getCompany.company_id,
        type:  "ALL",
        user_type_code: 'company',
      };
      const getFramework = await this.externalApiCallService.getReq(
        process.env.COMPANY_SERVER_API_URL + 'getFramework',
        queryParam,
        {},
      );
      const frameworkId = getFramework.data.map(obj => obj.id);
      let queryParam1 = {
        companyId: getCompany.company_id,
        type: "ESG",
        user_type_code: 'company',
        framework_ids: frameworkId,
      };
      const getTopic = await this.externalApiCallService.getReq(
        process.env.COMPANY_SERVER_API_URL + 'getTopic',
        queryParam1,
        {},
      );
      const manTopics = getTopic.data["mandatory_topics"]
      const topicId = manTopics.map(obj => obj.id);

      let esgReportingData: EsgReportingEntity = new EsgReportingEntity(
        req.query.financial_year_id,
        "SQ",
        JSON.stringify({
          customKpiId: [],
          mandatoryTopicsId: topicId,
          voluntaryTopicsId: [],
          mandatoryKpiId: [],
          voluntaryKpiId: [],
          customTopicsId: [],
          frameworkId: frameworkId,
        }),
        getCompany.company_id,
        systemUserId,
      );

      await this.esgReportingDaoService.insertEsgReportingData(
        esgReportingData,
      );
    }
    const getUpdatedESGReport =
    await this.esgReportingDaoService.getEsgReportingBasedOnUserId(
      systemUserId,
    );
    const found = getUpdatedESGReport.length;
    if (found) {
      const parsedFrameworkTopicKPI = JSON.parse(
        getUpdatedESGReport[0].frameworkTopicKpi,
      );
      getUpdatedESGReport[0].frameworkTopicKpi = parsedFrameworkTopicKPI;
      if (getUpdatedESGReport.length) {
        throw new HttpException(
          {
            status: 200,
            message: 'Data Found',
            data: getUpdatedESGReport,
          },
          HttpStatus.OK,
        );
      }
    } else {
      throw new HttpException(
        {
          status: 200,
          message: 'Please select framework',
          mainCompany: getCompany.parent_id ? false : true,
          data: [],
        },
        HttpStatus.OK,
      );
    }
  }

  async saveESGReport(createEsgReportingDto: CreateEsgReportingDto, req: any) {
    const systemUserId = req.headers.userid;
    const getCompany =
      await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId);
    const esgReportingDeatls =
      await this.esgReportingDaoService.getEsgReportingBasedOnUserId(
        systemUserId,
      );
    let insertedData;
    if (esgReportingDeatls.length) {
      insertedData = await this.esgReportingDaoService.updateEsgReporting(
        createEsgReportingDto.financialYearId,
        createEsgReportingDto.frameworkTopicKpi,
      );
    } else {
      let esgReportingData: EsgReportingEntity = new EsgReportingEntity(
        createEsgReportingDto.financialYearId,
        createEsgReportingDto.questionnaireType,
        createEsgReportingDto.frameworkTopicKpi,
        getCompany.company_id,
        systemUserId,
      );
      insertedData =
        await this.esgReportingDaoService.insertEsgReportingData(
          esgReportingData,
        );
    }

    if (insertedData) {
      throw new HttpException(
        {
          status: 200,
          message: 'Save successfully',
        },
        HttpStatus.OK,
      );
    }
  }
}
