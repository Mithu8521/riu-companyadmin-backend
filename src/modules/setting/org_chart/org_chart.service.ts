import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { OrgChartEntity } from './entities/org_chart.entity';
import { CreateOrgChartDto } from './dto/create-org_chart.dto';
import { UserDaoService } from '@modules/dao/setting/user-dao/user-dao.service';
import { OrgChartDaoService } from '@modules/dao/setting/org-chart-dao/org-chart-dao.service';
import { SubUserDaoService } from '@modules/dao/setting/sub-user-dao/sub-user-dao.service';
import { UserActivityLog } from '../user/entities/user_activity_logs';

interface OrgData {
  userId: string;
  orgChart?: any;
  children?: OrgData[];
}

@Injectable()
export class OrgChartService {
  constructor(private orgChartDaoService: OrgChartDaoService, private userDaoService: UserDaoService, private subUserDaoService: SubUserDaoService) { }



  async createOrgChart(createOrgChartDto: CreateOrgChartDto, req: any) {
    const systemUserId = req.headers.userid;
    const systemUserInfo = await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId);
    const { orgChart, parentUserId, userId, validateAudit } = createOrgChartDto;
    const { id: headOffice } = await this.userDaoService.getCompanyDetailsBasedOnParentIdNull();
    const getOrgDetails = await this.orgChartDaoService.getOrgChartUserId(headOffice);
    const newOrgChartObject: OrgData = JSON.parse(orgChart);
    const updatedOrgChart = getOrgDetails
      ? await this.updateUserOrgChart(JSON.parse(getOrgDetails.orgChart), systemUserId, newOrgChartObject)
      : newOrgChartObject;

    const operationResult = getOrgDetails
      ? await this.orgChartDaoService.updateOrgChartUserId(headOffice, JSON.stringify(updatedOrgChart))
      : await this.orgChartDaoService.createOrgChart(new OrgChartEntity(JSON.stringify(updatedOrgChart), systemUserId, systemUserId, systemUserId));
    if (userId) {
      if (parentUserId) {
        await this.subUserDaoService.updateParentId(userId, parentUserId);
      }
      if (validateAudit) {
        await this.userDaoService.updateAuditor(parentUserId, validateAudit, parentUserId);
      }
    }
    // Create activity log message
    // Get user details if user ID was provided
    let userDetails = null;
    let parentUserDetails = null;

    if (userId) {
      userDetails = await this.userDaoService.getCompanyDetailsBasedOnUserId(userId);
    }

    if (parentUserId) {
      parentUserDetails = await this.userDaoService.getCompanyDetailsBasedOnUserId(parentUserId);
    }
    const actionType = getOrgDetails ? 'updated' : 'created';
    let logMessage = `Organization chart ${actionType}`;

    if (userId && userDetails) {
      logMessage += ` - User ${userDetails.first_name} ${userDetails.last_name}`;

      if (parentUserId && parentUserDetails) {
        logMessage += ` assigned to ${parentUserDetails.first_name} ${parentUserDetails.last_name}`;
      }
    }

    // Create activity log
    const activityLog = UserActivityLog.createLog(
      logMessage,
      'Org Chart Update',
      'success',
      systemUserId,
      headOffice,
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
    if (operationResult) {
      throw new HttpException({ notShowPopUp: true, message: getOrgDetails ? 'Updated' : 'Created' }, HttpStatus.OK);
    }
  }

  async getOrgChart(req: any) {
    const systemUserId = req.headers.userid;
    const { id: headOffice } = await this.userDaoService.getCompanyDetailsBasedOnParentIdNull();
    const getHeadOrgDetails = await this.orgChartDaoService.getOrgChartUserId(headOffice);
    const userOrgChart = await this.findUserOrgChart(JSON.parse(getHeadOrgDetails.orgChart), JSON.parse(systemUserId));
    const orgChartObject = { orgChart: userOrgChart, userId: systemUserId };

    if (orgChartObject) {
      throw new HttpException({ status: 200, message: 'Data Found', data: orgChartObject }, HttpStatus.OK);
    }
  }

  private async updateUserOrgChart(orgData: OrgData, targetUserId: string, newOrgChart: OrgData): Promise<OrgData | null> {
    const parsedTargetUserId = JSON.parse(targetUserId);
    if (orgData.userId === parsedTargetUserId) {
      return newOrgChart;
    }
    const updatedChildren = await Promise.all((orgData.children || []).map(async (child) => {
      const updatedChild = await this.updateUserOrgChart(child, targetUserId, newOrgChart);
      return updatedChild;
    }));
    return { ...orgData, children: updatedChildren };
  }

  private async findUserOrgChart(orgData: OrgData, targetUserId: string): Promise<OrgData | null> {
    if (orgData.userId === targetUserId) return orgData;

    for (const child of orgData.children || []) {
      const result = await this.findUserOrgChart(child, targetUserId);
      if (result) return result;
    }

    return null;
  }

}
