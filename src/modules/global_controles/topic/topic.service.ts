import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateTopicDto } from './dto/create-topic.dto';
import { GetTopicDto } from './dto/get-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { DeleteTopicDto } from './dto/delete-topic.dto';
import { TopicDaoService } from '@modules/dao/global_controles/topic-dao/topic-dao.service';
import { TopicEntity } from './entities/topic.entity';
import { UserDaoService } from '@modules/dao/setting/user-dao/user-dao.service';
import { FrameworkDaoService } from '@modules/dao/global_controles/framework-dao/framework-dao.service';

@Injectable()
export class TopicService {
  constructor(
    private topicDaoService: TopicDaoService,
    private userDaoService: UserDaoService,
    private frameworkDaoService: FrameworkDaoService
  ) {}

  async getTopicByFrameworkId(getTopicDto: GetTopicDto, req: any) {
    const getTopicDeatls = await this.topicDaoService.getTopicBasedFrameworkId(
      req.query.frameworkId,
    );
    if (getTopicDeatls) {
      throw new HttpException(
        {
          status: 200,
          message: 'Data Found',
          data: getTopicDeatls,
        },
        HttpStatus.OK,
      );
    }
  }

  async createTopic(createTopicDto: CreateTopicDto, req: any) {
    const systemUserId = req.headers.userid;
    const getCompany =
      await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId);
    let topicData: TopicEntity = new TopicEntity(
      createTopicDto.frameworkId,
      createTopicDto.topicTitle,
      false,
      false,
      systemUserId,
      systemUserId,
      getCompany.company_id,
      true,
    );
    let insertedData = await this.topicDaoService.createTopic(topicData);
    if(insertedData)
    {
     await this.frameworkDaoService.updateFrameworkWhenTopicCreate( createTopicDto.frameworkId,true,false)
    }
    if (insertedData) {
      const getTopicDeatls =
        await this.topicDaoService.getTopicBasedFrameworkId(
          createTopicDto.frameworkId,
        );
      if (getTopicDeatls) {
        throw new HttpException(
          {
            data: getTopicDeatls,
            status: 200,
            message: 'Created successfully',
          },
          HttpStatus.OK,
        );
      }
    }
  }

  async updateTopic(updateTopicDto: UpdateTopicDto, req: any) {
    const systemUserId = req.headers.userid;
    const updateTopic = await this.topicDaoService.updateTopic(
      updateTopicDto.topicId,
      systemUserId,
      updateTopicDto.topicTitle,
    );
    if (updateTopic) {
      const getTopicDeatls =
        await this.topicDaoService.getTopicBasedFrameworkId(
          updateTopicDto.frameworkId,
        );
      if (getTopicDeatls) {
        throw new HttpException(
          {
            status: 200,
            message: 'Successfully Update',
            data: getTopicDeatls,
          },
          HttpStatus.OK,
        );
      }
    }
  }

  async deleteTopic(deleteTopicDto: DeleteTopicDto, req: any) {
    const { topicId } = deleteTopicDto;
    const deletedData = await this.topicDaoService.deleteTopicData(topicId);
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
