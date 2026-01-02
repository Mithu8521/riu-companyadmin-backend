import { ReportingModuleDaoService } from '@modules/dao/reporting-module-dao/reporting-module-dao.service';
import { OrgChartDaoService } from '@modules/dao/setting/org-chart-dao/org-chart-dao.service';
import { UserDaoService } from '@modules/dao/setting/user-dao/user-dao.service';
import { Injectable } from '@nestjs/common';
import { ExternalApiCallService } from '@utils/common/external-api-call/external-api-call.service';

@Injectable()
export class TriggerReminderService {
  constructor(private externalApiCallService: ExternalApiCallService, private userDaoService: UserDaoService, private reportingModuleDaoService: ReportingModuleDaoService,private orgChartDaoService: OrgChartDaoService
  ) { }

  async emailforPerformanceReport(req: any) {
    const systemUserId = req.headers.userid;
    const financialYearId = req.query.financialYearId ? req.query.financialYearId : 6;
    // if (systemUserId && systemUserId !== null) {
    //   const assignedQuestions = await this.sectorQuestionDaoModuleService.getQuestionIds(Number(systemUserId), Number(financialYearId))
    //   if (assignedQuestions) {
    //     throw new HttpException(
    //       { status: 200, message: 'Data Found', data: assignedQuestions },
    //       HttpStatus.OK,
    //     );
    //   }
    // }
  }

  
  async saveTriggerData(req: any) {
    const systemUserId = req.headers.userid;
    const financialYearId = req.query.financialYearId ? req.query.financialYearId : 6;
    // if (systemUserId && systemUserId !== null) {
    //   const assignedQuestions = await this.sectorQuestionDaoModuleService.getQuestionIds(Number(systemUserId), Number(financialYearId))
    //   if (assignedQuestions) {
    //     throw new HttpException(
    //       { status: 200, message: 'Data Found', data: assignedQuestions },
    //       HttpStatus.OK,
    //     );
    //   }
    // }
  }

  async emailforWeeklyReminder(req: any) {
    const orgChartData = await this.orgChartDaoService.getOrgChartUserId(1);
    await this.iterateChildren(orgChartData);  
  }
  
  private async iterateChildren(node: any): Promise<void> {
    console.log(`ID: ${node.id}, Name: ${node.name}, Role: ${node.role || "N/A"}, Level: ${node.level}`);

    
  
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        await this.iterateChildren(child);
      }
    }
  } 

}
