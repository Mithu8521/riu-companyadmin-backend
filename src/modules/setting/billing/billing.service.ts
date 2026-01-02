import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateBillingDto } from './dto/create-billing.dto';
import { UpdateBillingDto } from './dto/update-billing.dto';
import { ExternalApiCallService } from '@utils/common/external-api-call/external-api-call.service';
import { UserDaoService } from '@modules/dao/setting/user-dao/user-dao.service';

@Injectable()
export class BillingService {
  constructor(private externalApiCallService: ExternalApiCallService,private userDaoService: UserDaoService) {}

  async getSubcriptionPlane(req: any) {
    let body = {
      subscription_type: 'All',
      current_role: 'COMPANY',
      company_id: req.query.userId,
    };
    const billingData = await this.externalApiCallService.getReq(
      process.env.COMPANY_SERVER_API_URL + 'getAllSubscription',
      body,
      {},
    );


    throw new HttpException(
      {
        message: 'Data Found',
        data: billingData.data,
      },
      HttpStatus.OK,
    );
  }

  async cancelPlan(req: any) {
    const systemUserId = req.headers.userid;
    const getCompany =
      await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId);
       let body = {
      company_id: getCompany.company_id,
    };
    const cancelPlan= await this.externalApiCallService.postReq(
      {},
      body,
      process.env.COMPANY_SERVER_API_URL + 'cancelPlan',
    );
    throw new HttpException(
      {
        status:200,
        message: cancelPlan?.message,
       
      },
      HttpStatus.OK,
    );
  }

  async updradPlan(req: any) {}

  async downdradPlan(req: any) {}
}
