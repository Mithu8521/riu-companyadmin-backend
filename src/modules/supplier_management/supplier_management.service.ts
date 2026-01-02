import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ExternalApiCallService } from '@utils/common/external-api-call/external-api-call.service';
import { UserDaoService } from '@modules/dao/setting/user-dao/user-dao.service';
import { SubUserDaoService } from '@modules/dao/setting/sub-user-dao/sub-user-dao.service';
import { InviteSupplierManagementDto } from './dto/invite-supplier_management.dto';
import { SendMailService } from '@utils/common/send-mail/send-mail.service';
import { ActionSupplierInvitation } from './dto/action-supplier-invitation.dto';
import { ActionSupplierRegistered } from './dto/action-supplier-registered.dto';
@Injectable()
export class SupplierManagementService {
  constructor(private externalApiCallService: ExternalApiCallService, private userDaoService: UserDaoService, private subUserDaoService: SubUserDaoService, private sendMailService: SendMailService
  ) { }
  async inviteSupplier(inviteSupplierManagementDto: InviteSupplierManagementDto, req: any) {
    const getCompany = await this.userDaoService.getHeadOfficeCompanyDetails(true);
    let body = { company_name: inviteSupplierManagementDto.companyName, email: inviteSupplierManagementDto.email, userId: getCompany.company_id, inviteeUserTypeCode: "COMPANY" };
    const userData = await this.externalApiCallService.postReq({}, body, process.env.COMPANY_SERVER_API_URL + 'inviteSupplier');
    if (userData.status === 200) {
      throw new HttpException({ message: 'Invite Successfully !!' }, HttpStatus.OK);
    } else {
      throw new HttpException({ message: 'Somethings went wrong!' }, HttpStatus.CONFLICT);
    }
  }
  async actionSupplierRequest(actionSupplierInvitation: ActionSupplierInvitation, req: any) {
    const systemUserId = req.headers.userid;
    const {supplierId, actionType} = actionSupplierInvitation;
    const companyId = (await this.userDaoService.getCompanyDetailsBasedOnUserId(Number(systemUserId))).company_id;
    let body = { companyId: companyId, id: supplierId, actionType: actionType, inviteeUserTypeCode: "COMPANY" };
    const actionData = await this.externalApiCallService.postReq({}, body, process.env.COMPANY_SERVER_API_URL + 'actionSupplierInvitation');
    if (actionData.status === 200) {
      throw new HttpException({ message: actionData.message }, HttpStatus.OK);
    } else {
      throw new HttpException({ message: 'Somethings went wrong!' }, HttpStatus.CONFLICT);
    }
  }
  async actionRegisteredSupplier(actionSupplierRegistered: ActionSupplierRegistered, req: any) {
    const systemUserId = req. headers.userid;
    const {supplierId, actionType} = actionSupplierRegistered;
    const companyId = (await this.userDaoService.getCompanyDetailsBasedOnUserId(Number(systemUserId))).company_id;
    let body = { companyId: companyId, id: supplierId, actionType: actionType, inviteeUserTypeCode: "COMPANY" };
    const actionData = await this.externalApiCallService.postReq({}, body, process.env.COMPANY_SERVER_API_URL + 'actionSupplierRegistered');
    if (actionData.status === 200) {
      throw new HttpException({ message: actionData.message }, HttpStatus.OK);
    } else {
      throw new HttpException({ message: 'Somethings went wrong!' }, HttpStatus.CONFLICT);
    }
  }
  
  async getSupplier(req: any) {
    const systemUserId = req.headers.userid;
    const {type} = req.query;
    const companyId = (await this.userDaoService.getCompanyDetailsBasedOnUserId(Number(systemUserId))).company_id;
    const response = await this.externalApiCallService.getReq( process.env.COMPANY_SERVER_API_URL + 'getInvitedSuppliers', { companyId: companyId, type: type, user_type_code: 'COMPANY' }, {} );
    if (response.status === 200) {
      throw new HttpException({ message: 'Data Found' ,data:  response.data}, HttpStatus.OK);
    } else {
      throw new HttpException({ message: 'Data Found' }, HttpStatus.CONFLICT);
    }
  }
}
