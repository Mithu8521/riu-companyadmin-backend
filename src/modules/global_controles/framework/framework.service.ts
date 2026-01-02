import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateFrameworkDto } from './dto/create-framework.dto';
import { GetFrameworkDto } from './dto/get-framework.dto';
import { UpdateFrameworkDto } from './dto/update-framework.dto';
import { DeleteFrameworkDto } from './dto/delete-framework.dto';
import { FrameworkDaoService } from '@modules/dao/global_controles/framework-dao/framework-dao.service';
import { FrameworkEntity } from './entities/framework.entity';
import { UserDaoService } from '@modules/dao/setting/user-dao/user-dao.service';

@Injectable()
export class FrameworkService {
  constructor(
    private frameworkDaoService: FrameworkDaoService,
    private userDaoService: UserDaoService,
  ) {}

  async getFramework(req: any) {
    const getFrameworkDeatls =
      await this.frameworkDaoService.getFrameworkBasedCompanyId(
        req.query.companyId,
      );
    if (getFrameworkDeatls) {
      throw new HttpException(
        {
          status: 200,
          message: 'Successfully Created',
          data: getFrameworkDeatls,
        },
        HttpStatus.OK,
      );
    }
  }

  async createFramework(createFrameworkDto: CreateFrameworkDto, req: any) {
    const systemUserId = req.headers.userid;
    const getCompany =
      await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId);
    let frameworkData: FrameworkEntity = new FrameworkEntity(
      createFrameworkDto.frameworkTitle,
      createFrameworkDto.financialYearId,
      false,
      false,
      false,
      systemUserId,
      systemUserId,
      getCompany.company_id,
      true,
    );
    let insertedData =
      await this.frameworkDaoService.createFramework(frameworkData);
    if (insertedData) {
      const getFrameworkDeatls =
        await this.frameworkDaoService.getFrameworkBasedCompanyId(
          getCompany.company_id,
        );
      if (getFrameworkDeatls) {
        throw new HttpException(
          {
            status: 200,
            message: 'Data Found',
            data: getFrameworkDeatls,
          },
          HttpStatus.OK,
        );
      }
      throw new HttpException(
        {
          data: getFrameworkDeatls,
          status: 200,
          message: 'Created successfully',
        },
        HttpStatus.OK,
      );
    }
  }

  async updateFramework(updateFrameworkDto: UpdateFrameworkDto, req: any) {
    const systemUserId = req.headers.userid;
    const getCompany =
      await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId);
    const updateFramework = await this.frameworkDaoService.updateFramework(
      updateFrameworkDto.frameworkId,
      systemUserId,
      updateFrameworkDto.frameworkTitle,
    );
    if (updateFramework) {
      const getFrameworkDeatls =
        await this.frameworkDaoService.getFrameworkBasedCompanyId(
          getCompany.company_id,
        );
      if (getFrameworkDeatls) {
        throw new HttpException(
          {
            status: 200,
            message: 'Successfully Updated',
            data: getFrameworkDeatls,
          },
          HttpStatus.OK,
        );
      }
    }
  }

  async deleteFramework(deleteFrameworkDto: DeleteFrameworkDto, req: any) {
    const { frameworkId } = deleteFrameworkDto;
    const deletedData = await this.frameworkDaoService.deleteFrameworkData(frameworkId);
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
