import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { ExternalApiCallService } from "@utils/common/external-api-call/external-api-call.service";
import { SaveUnitCatagoryDto } from "./dto/create-unit.dto";
import { UserDaoService } from "@modules/dao/setting/user-dao/user-dao.service";
import { UnitDaoService } from "@modules/dao/setting/unit-dao/unit-dao.service";
import { Unit } from "./entities/unit.entity";
@Injectable()
export class UnitService {
  constructor(private externalApiCallService: ExternalApiCallService, private userDaoService: UserDaoService, private unitDaoService: UnitDaoService) { }

  async getUnitCatagory(req: any) {
    const systemUserId = req.headers.userid;
    const getCompany = await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId);
    let queryParam = { companyId: getCompany.company_id, type: "ALL", user_type_code: 'company', };
    const getUnitBasedQuestion = await this.externalApiCallService.getReq(
      process.env.COMPANY_SERVER_API_URL + 'getUnitBasedQuestion',
      queryParam,
      {},
    );
    const existingRecord = await this.unitDaoService.getAllUnit();
    getUnitBasedQuestion.data = getUnitBasedQuestion.data.map((question: any) => {
      const matchingUnit = existingRecord.find((unit: any) => unit.catagoryId === question.id);
      return {
        ...question,
        unit: matchingUnit?.unit || null,
        isEditable: matchingUnit ? matchingUnit.isEditable !== false : true,
      };
    });
    throw new HttpException({ status: 200, message: 'Data Found', data: getUnitBasedQuestion.data, }, HttpStatus.OK,);
  }

  async getUnit(req: any) {
    const existingRecord = await this.unitDaoService.getAllUnit();
    throw new HttpException({ status: 200, message: 'Data Found', data: existingRecord, }, HttpStatus.OK,);
  }

  

  async saveUnitCatagory(saveUnitCatagoryDto: SaveUnitCatagoryDto, req: any) {
    const systemUserId = req.headers.userid;
    const { catagoryId, unit } = saveUnitCatagoryDto;
    const existingRecord = await this.unitDaoService.getUnit(catagoryId);
    if (existingRecord) {
      await this.unitDaoService.updateUnit(catagoryId, unit);
      throw new HttpException({ status: 200, message: 'Unit Updated', }, HttpStatus.OK);
    } else if (existingRecord === null) {
      const answerEntity = new Unit(systemUserId, catagoryId, unit, true);
      const insertAnswer = await this.unitDaoService.saveUnit(answerEntity);
      throw new HttpException({ status: 200, message: 'Unit Saved', }, HttpStatus.OK);

    }
  }
}

