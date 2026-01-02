import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ExternalApiCallService } from '@utils/common/external-api-call/external-api-call.service';
import { GwpDaoService } from '@modules/dao/setting/gwp-dao/gwp-dao.service';
import { UserDaoService } from '@modules/dao/setting/user-dao/user-dao.service';
import { UpdateGhgDataBaseDto } from './dto/update-ghg-Protocol.dto';

@Injectable()
export class GwpService {
  constructor(private gwpDaoService: GwpDaoService, private externalApiCallService: ExternalApiCallService, private userDaoService: UserDaoService) { }

  async databaseVersionList(req: any) {
    const systemUserId = req.headers.userid;
    const getCompany = await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId);

    const queryParam = {
      company_id: getCompany.company_id,
    };

    const dataBaseList = await this.externalApiCallService.getReq(
      process.env.COMPANY_SERVER_API_URL + 'ghg/databases',
      queryParam,
      {},
    );

    const selectedData = await this.gwpDaoService.getGwpValue();

    const result = {
      dataBaseList: dataBaseList.data,
      selectedData: selectedData
    };
    throw new HttpException({ status: 200, message: 'Data Found', data: result }, HttpStatus.OK);
  }

  async getDataBaseAndVersion(req: any) {
    const { financialYearId } = req.query;
    const gwpValue = await this.gwpDaoService.getDataBaseValueBasedOnFinanacialYear(Number(financialYearId));
    throw new HttpException({ status: 200, message: 'Data Found', data: gwpValue }, HttpStatus.OK);
  }



  async updateGhgProtocol(body: UpdateGhgDataBaseDto, req: any) { // Keeping the same method name for compatibility
    const systemUserId = Number(req.headers.userid);
    const { financialYearId, databaseId } = body;
    const result = await this.gwpDaoService.updateGwpId( // Keeping the same service method name
      financialYearId,
      databaseId,
      systemUserId
    );

    throw new HttpException({ status: 200, message: result.message }, HttpStatus.OK);
  }

}
