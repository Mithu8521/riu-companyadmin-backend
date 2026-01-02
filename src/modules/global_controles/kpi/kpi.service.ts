import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateKpiDto } from './dto/create-kpi.dto';
import { GetKpiDto } from './dto/get-kpi.dto';
import { UpdateKpiDto } from './dto/update-kpi.dto';
import { DeleteKpiDto } from './dto/delete-kpi.dto';
import { KpiDaoService } from '@modules/dao/global_controles/kpi-dao/kpi-dao.service';
import { KpiEntity } from './entities/kpi.entity';
import { UserDaoService } from '@modules/dao/setting/user-dao/user-dao.service';
import { TopicDaoService } from '@modules/dao/global_controles/topic-dao/topic-dao.service';

@Injectable()
export class KpiService {
  constructor(
    private kpiDaoService: KpiDaoService,
    private userDaoService: UserDaoService,
    private topicDaoService:TopicDaoService
  ) {}

  async getCustomKpiByTopicId(req: any) {
    const getKpiDeatls = await this.kpiDaoService.getKpiBasedTopicId(
      req.query.topicId,
    );
    if (getKpiDeatls) {
      throw new HttpException(
        {
          status: 200,
          message: 'Data Found',
          data: getKpiDeatls,
        },
        HttpStatus.OK,
      );
    }
  }

  async createKpi(createKpiDto: CreateKpiDto, req: any) {
    const systemUserId = req.headers.userid;
    const getCompany =
      await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId);
    let kpiData: KpiEntity = new KpiEntity(
      createKpiDto.topicId,
      createKpiDto.kpiTitle,
      false,
      systemUserId,
      systemUserId,
      getCompany.company_id,
      true,
    );
   
    let insertedData = await this.kpiDaoService.createKpi(kpiData);
    if(insertedData)
    {
     await this.topicDaoService.updateTopicWhenKpiCreate(  createKpiDto.topicId,true,false)
    }
    if (insertedData) {
      const getKpiDeatls = await this.kpiDaoService.getKpiBasedTopicId(
        createKpiDto.topicId,
      );
      if (getKpiDeatls) {
        throw new HttpException(
          {
            data: getKpiDeatls,
            status: 200,
            message: 'Created successfully',
          },
          HttpStatus.OK,
        );
      }
    }
  }

  async updateKpi(updateKpiDto: UpdateKpiDto, req: any) {
    const systemUserId = req.headers.userid;
    const updateKpi = await this.kpiDaoService.updateKpi(
      updateKpiDto.kpiId,
      systemUserId,
      updateKpiDto.kpiTitle,
    );
    if (updateKpi) {
      const getKpiDeatls = await this.kpiDaoService.getKpiBasedTopicId(
        updateKpiDto.topicId,
      );
      if (getKpiDeatls) {
        throw new HttpException(
          {
            status: 200,
            message: 'Successfully Update',
            data: getKpiDeatls,
          },
          HttpStatus.OK,
        );
      }
    }
  }

  async deleteKpi(deleteKpiDto: DeleteKpiDto, req: any) {
    const { kpiId } = deleteKpiDto;
    const deletedData = await this.kpiDaoService.deleteKpiData(kpiId);
    if (deletedData) {
      throw new HttpException(
        {
          status: 200,
          message: 'Deleted successfully',
        },
        HttpStatus.OK,
      );
    } else {
      throw new HttpException(
        {
          status: 404,
          message: 'Designation not found', 
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }
}
