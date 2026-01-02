import { HttpException, HttpStatus, Injectable, Scope } from '@nestjs/common';
import { CarbonEmissionDaoService } from '@modules/dao/carbon_emission-dao/carbon_emission-dao.service';
import { ExternalApiCallService } from '@utils/common/external-api-call/external-api-call.service';
import { GwpDaoService } from '@modules/dao/setting/gwp-dao/gwp-dao.service';
import { FuelConsumptionDto } from './dto/create-carban_emission.dto';
import { SaveEmissionCalculationDto } from './dto/save-carbon_emission.dto';
import { EmissionScopeEntity } from './entities/emission_calculation.entity';
import { ReportingModuleDaoService } from '@modules/dao/reporting-module-dao/reporting-module-dao.service';
import { UserDaoService } from '@modules/dao/setting/user-dao/user-dao.service';
import { GHGScope } from '@utils/enums/Status';
import { EntitySchema } from 'typeorm';
import { SuperAdminClientService } from '@modules/super-admin-client/super-admin-client.service';

@Injectable()
export class CarbanEmissionService {
  constructor(
    private carbonEmissionDaoService: CarbonEmissionDaoService, 
    private externalApiCallService: ExternalApiCallService, 
    private gwpDaoService: GwpDaoService, 
    private reportingModuleDaoService: ReportingModuleDaoService, 
    private userDaoService: UserDaoService,
    private superAdminClientService: SuperAdminClientService,
  ) { }

  async calculateEmission(body: FuelConsumptionDto, req: any) {
    const { fuelId, consumption, financialYearId } = body;
    const gwpValue = await this.gwpDaoService.getDataBaseValueBasedOnFinanacialYear(financialYearId);

    const queryParam = {
      fuelId: fuelId,
      gwpId: gwpValue.gwpId,
      readingValue: consumption,
    };

    const getScopeCalculation = await this.externalApiCallService.getReq(
      process.env.COMPANY_SERVER_API_URL + 'emissionCalculation',
      queryParam,
      {},
    );
    throw new HttpException({ status: 200, message: 'Data Found', notShowPopUp: true, data: getScopeCalculation.data.calculations }, HttpStatus.OK);
  }

  async saveEmissionCalculation(body: SaveEmissionCalculationDto, req: any) {
    try {
      const {
        id,
        financialYearId,
        ghgScope,
        ghgDatabaseId,
        questionId,
        sourceId,
        subLocationId,
        fromDate,
        toDate,
        inputDetails,
      } = body;
      const userId = req.headers.userid;

      // Check existing record in reporting module (if needed)
      const existingRecord = subLocationId
        ? await this.reportingModuleDaoService.getExistingRecordForCustoms(questionId, sourceId, financialYearId, fromDate, toDate, subLocationId)
        : await this.reportingModuleDaoService.getExistingRecordForCustom(questionId, sourceId, financialYearId, fromDate, toDate);

      // First try to find an existing emission calculation record

      let existingCalculation;
      if (id) {
        existingCalculation = await this.carbonEmissionDaoService.findEmissionCalculation({id});
      }

      if (!existingCalculation) {
        const existingCalculations = await this.carbonEmissionDaoService.findEmissionCalculations({
          userId,
          financialYearId,
          ghgScope,
          ghgDatabaseId,
          questionId,
          fromDate,
          toDate,
          sourceId,
          subLocationId,
        });

        const duplicateCalculations = existingCalculations.filter(entry => this.isDuplicateEmissionEntry({
          financialYearId,
          sourceId,
          subLocationId,
          fromDate,
          toDate,
          inputDetails: JSON.parse(inputDetails),
        }, entry));

        if (duplicateCalculations && duplicateCalculations.length > 0) {
          throw new HttpException(
            'Duplicate emission entry detected. Please edit the existing entry.', 
            HttpStatus.BAD_REQUEST
          );
        }
      }

      if (existingCalculation) {
        // Update existing record
        existingCalculation.userId = userId;
        existingCalculation.financialYearId = financialYearId;
        existingCalculation.ghgScope = ghgScope;
        existingCalculation.ghgDatabaseId = ghgDatabaseId;
        existingCalculation.questionId = questionId;
        existingCalculation.inputDetails = inputDetails;
        existingCalculation.fromDate = fromDate;
        existingCalculation.toDate = toDate;
        existingCalculation.sourceId = sourceId;
        existingCalculation.subLocationId = subLocationId;
        existingCalculation.updatedAt = new Date();
        existingCalculation.status = true;

        const updatedCalculation = await this.carbonEmissionDaoService.saveEmissionCalculation(
          existingCalculation as EmissionScopeEntity
        );

        return {
          status: 200,
          message: 'Data Updated Successfully',
          data: updatedCalculation
        };
      } else {
        // Create new record
        const emissionCalculation = new EmissionScopeEntity(
          userId,
          financialYearId,
          ghgScope,
          ghgDatabaseId,
          questionId,
          inputDetails,
          fromDate,
          toDate,
          sourceId,
          subLocationId,
          true // status
        );

        const savedCalculation = await this.carbonEmissionDaoService.saveEmissionCalculation(
          emissionCalculation as EmissionScopeEntity
        );

        return {
          status: 200,
          message: 'Data Created Successfully',
          data: savedCalculation
        };
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Error saving emissions', error);
      throw new HttpException('Error saving emissions', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getScopeEmissionData(req: any) {
    try {
      const { financialYearId, ghgScope } = req.query;

      // Validate required parameters
      if (!financialYearId || !ghgScope) {
        throw new HttpException(
          { status: 400, message: 'financialYearId and ghgScope are required' },
          HttpStatus.BAD_REQUEST,
        );
      }


      const parsedYearId = parseInt(financialYearId, 10);
      const scope = ghgScope as GHGScope;

      // Get database configuration for the financial year
      const selectedData = await this.gwpDaoService.getDataBaseValueBasedOnFinanacialYear(parsedYearId);

      if (!selectedData) {
        throw new HttpException(
          { status: 404, message: 'No database configuration found for the specified financial year' },
          HttpStatus.NOT_FOUND,
        );
      }

      // Fetch emission calculations
      const emissionCalculations = await this.carbonEmissionDaoService.findEmissionCalculationBasedOnFinancialYear(
        parsedYearId,
        scope,
        selectedData.databaseId,
      );

      // Transform the data to include all necessary fields for frontend
      const result = emissionCalculations.map(item => ({
        id: item.id,
        userId: item.userId,
        financialYearId: item.financialYearId,
        ghgDatabaseId: item.ghgDatabaseId,
        questionId: item.questionId,
        sourceId: item.sourceId,
        subLocationId: item.subLocationId,
        fromDate: item.fromDate,
        toDate: item.toDate,
        ghgScope: item.ghgScope,
        inputDetails: item.inputDetails
      }));

      return {
        status: 200,
        message: `Found entries`,
        data: result,

      };
    } catch (error) {
      console.error('Error fetching emissions', error);
      throw new HttpException('Error fetching emissions', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getScope3Categories(req: any) {
    try {
      return await this.externalApiCallService.getReq(
        process.env.COMPANY_SERVER_API_URL + 'ghg/scope3/categories',
        {},
        {},
      );
    } catch (error) {
      console.error("Error fetching scope3 categories.", error);
      throw new HttpException('Something went wrong!', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getGHGDataBase(req: any) {
    const userId = req.headers.userid;
    const company = await this.userDaoService.getCompanyDetailsBasedOnUserId(userId);
    const frameworkIds = await this.superAdminClientService.getFrameworkIds(company.company_id);
    const { financialYearId, scope } = req.query;
    const selectedData = await this.gwpDaoService.getDataBaseValueBasedOnFinanacialYear(Number(financialYearId));

    if (!selectedData) {
      throw new HttpException(
        { status: 404, message: 'No database configuration found for the specified financial year' },
        HttpStatus.NOT_FOUND,
      );
    }
    const queryParam = {
      countryCode: company.country,
      databaseId: selectedData.databaseId,
      scope: scope,
      company_id: company.company_id,
      user_type_code: 'COMPANY',
      framework_ids: JSON.stringify(frameworkIds),
    };

    const getGHGData = await this.externalApiCallService.getReq(
      process.env.COMPANY_SERVER_API_URL + 'ghg/databases/conversionFactors',
      queryParam,
      {},
    );
    throw new HttpException({ status: 200, message: 'Data Found', data: { data: getGHGData.data, protocalConfig: getGHGData.databaseName ,protocal:getGHGData.protocal} }, HttpStatus.OK);

  }

  async getCarbonFootPrintingData(req: any) {
    const { financialYearId, questionId } = req.query;

    const emissionCalculation = await this.carbonEmissionDaoService.findEmissionCalculationBasedOnFinancialYearAndQuestionId(financialYearId, questionId);

    const result = emissionCalculation.map(item => ({
      id: item.id,
      userId: item.userId,
      financialYearId: item.financialYearId,
      questionId: item.questionId,
      sourceId: item.sourceId,
      category: item.category,
      subLocationId: item.subLocationId,
      fromDate: item.fromDate,
      toDate: item.toDate,
      period: item.period,
      calculationDetails: item.calculationDetails,
      readingValue: item.readingValue,
      co2Emissions: item.co2Emissions,
      ch4Emissions: item.ch4Emissions,
      n2oEmissions: item.n2oEmissions,
    }));
    throw new HttpException({ status: 200, message: 'Data Found', data: result }, HttpStatus.OK);
  }

  private isDuplicateEmissionEntry(newEntry, existingEntry) {
    const isDuplicateForm = (Object.keys(existingEntry.inputDetails.formData)?.length === Object.keys(newEntry.inputDetails.formData)?.length &&
      Object.entries(existingEntry.inputDetails.formData).every(([key, value]) => key === 'activityAmount' || newEntry.inputDetails.formData?.[key] === value));

    return (String(newEntry.financialYearId) === String(existingEntry.financialYearId) && 
      String(newEntry.sourceId) === String(existingEntry.sourceId) &&
      newEntry.fromDate === existingEntry.fromDate &&
      newEntry.toDate === existingEntry.toDate &&
      newEntry.inputDetails?.category === existingEntry.inputDetails?.category &&
      newEntry.inputDetails?.subCategory === existingEntry.inputDetails?.subCategory &&
      newEntry.inputDetails?.method === existingEntry.inputDetails?.method &&
      newEntry.inputDetails?.scope3CategoryId === existingEntry.inputDetails?.scope3CategoryId && 
      existingEntry.inputDetails?.defraScope3ActivityType === existingEntry.inputDetails?.defraScope3ActivityType &&
      isDuplicateForm
    )
  }

}
