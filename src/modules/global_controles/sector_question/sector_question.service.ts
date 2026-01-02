import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { GetSectorQuestionDto } from './dto/get-sector_question.dto';
import { CreateSectorQuestionDto } from './dto/create-sector_question.dto';
import { UpdateSectorQuestionDto } from './dto/update-sector_question.dto';
import { DeleteSectorQuestionDto } from './dto/delete-sector_question.dto';
import { UserDaoService } from '@modules/dao/setting/user-dao/user-dao.service';
import { SectorQuestionDaoService } from '@modules/dao/global_controles/sector-question-dao/sector-question-dao.service';
import { SectorQuestionEntity } from './entities/sector_question.entity';
import { KpiDaoService } from '@modules/dao/global_controles/kpi-dao/kpi-dao.service';
import { TopicDaoService } from '@modules/dao/global_controles/topic-dao/topic-dao.service';
import { FrameworkDaoService } from '@modules/dao/global_controles/framework-dao/framework-dao.service';
import { SectorQuestionDetailsEntity } from './entities/sector_question_details.entity';

@Injectable()
export class SectorQuestionService {
  constructor(
    private sectorQuestionDaoService: SectorQuestionDaoService,
    private userDaoService: UserDaoService,
    private kpiDaoService: KpiDaoService,
    private topicDaoService: TopicDaoService,
    private frameworkDaoService: FrameworkDaoService
  ) {}
  async getSectorQuestion(req: any) {
    const { kpiId, topicId, frameworkId } = req.query;
    const parsedKpiId = kpiId !== 'undefined' ? parseInt(kpiId, 10) : undefined;
    const parsedTopicId = topicId !== 'undefined' ? parseInt(topicId, 10) : undefined;
    const parsedFrameworkId = frameworkId !== 'undefined' ? parseInt(frameworkId, 10) : undefined;
  
    let getSectorQuestionDetailsDeatls;
  
    if (parsedKpiId) {
      getSectorQuestionDetailsDeatls = await this.sectorQuestionDaoService.getSectorQuestionBasedOnKpi(parsedKpiId);
    } else if (parsedTopicId) {
      getSectorQuestionDetailsDeatls = await this.sectorQuestionDaoService.getSectorQuestionBasedOnTopic(parsedTopicId);
    } else if (parsedFrameworkId) {
      getSectorQuestionDetailsDeatls = await this.sectorQuestionDaoService.getSectorQuestionBasedOnFramework(parsedFrameworkId);
    } else {
      throw new HttpException(
        {
          status: 400,
          message: 'Invalid Input Field',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    const questionDetails: any[] = [];
    for (const sectorQuestionDetails of getSectorQuestionDetailsDeatls) {
      const { frameworkId, topicId, kpiId ,id} = sectorQuestionDetails; 
      if (frameworkId !== null) {
        const frameworkDetails = await this.frameworkDaoService.getFrameworkBaseId(frameworkId);
        sectorQuestionDetails.frameworkTitle = frameworkDetails[0].frameworkTitle;
      }      
      if (topicId !== null) {
        const topicDetails = await this.topicDaoService.getTopicBasedId(topicId);
        sectorQuestionDetails.topicTitle = topicDetails[0].topicTitle;
      }      
      if (kpiId !== null) {
        const kpiDetails = await this.kpiDaoService.getKpiBasedId(kpiId);
        sectorQuestionDetails.kpiTitle = kpiDetails[0].kpiTitle; 
      }
      const showTableDetails = await this.sectorQuestionDaoService.getSectorQuestionDetails(id);
      sectorQuestionDetails.question_detail=  showTableDetails; 
      questionDetails.push({ ...sectorQuestionDetails });  
    }
    throw new HttpException(
      {
        status: 200,
        message: 'Data Found',
        data: questionDetails
      },
      HttpStatus.OK,
    );
  }
  

  async updateSectorQuestion(
    updateSectorQuestionDto: UpdateSectorQuestionDto,
    req: any,
  ) {}

  async deleteSectorQuestion(
    deleteSectorQuestionDto: DeleteSectorQuestionDto,
    req: any,
  ) {
    const { questionId } = deleteSectorQuestionDto;
    const deletedData = await this.sectorQuestionDaoService.deleteQuestionData(questionId);
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

  async createSectorQuestion(
    createSectorQuestionDto: CreateSectorQuestionDto,
    req: any,
  ) {
    const systemUserId = req.headers.userid;
    const getCompany =
      await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId);
    const companyId = getCompany.company_id;
    if (!companyId) {
      throw new HttpException(
        {
          status: 400,
          message: 'Invalid Company',
        },
        HttpStatus.CONFLICT,
      );
    }
    for (let element of JSON.parse(createSectorQuestionDto.questions)) {
      if (
        !element.questionType ||
        !element.questionHeading ||
        !element.questionTitle
      ) {
        throw new HttpException(
          {
            status: 400,
            message:
              'Question Type , Question Heading , Question Title is mendatory!',
          },
          HttpStatus.CONFLICT,
        );
      }

      if (element.questionType == 'tabular_question') {
        if (!element?.graphApplicable) {
          throw new HttpException(
            {
              status: 400,
              message: 'Graph Applicable Mendatory',
            },
            HttpStatus.CONFLICT,
          );
        }
      }

      // let isExist = await checkQuestionAlreadyExist(element, company_id); please do latter
    }
    for (let element of JSON.parse(createSectorQuestionDto.questions)) {
      let sectorQuestionData: SectorQuestionEntity = new SectorQuestionEntity(
        companyId,
        createSectorQuestionDto.frameworkId,
        createSectorQuestionDto.topicId,
        createSectorQuestionDto.kpiId,
        element.questionType,
        createSectorQuestionDto.entity,
        element.graphApplicable,
        element.isDependent,
        element.questionHeading,
        element.questionTitle,
        element.readingValue,
        systemUserId,
        systemUserId,
        true,
      );
      let insertedData =
        await this.sectorQuestionDaoService.createSectorQuestion(
          sectorQuestionData,
        );
        if (element.question_detail != null && element.question_detail) {
          let data = {
            questionId: insertedData.id,
          };
          let arr = [];
        
          for (var ele in element.question_detail) {
            element.question_detail[ele].forEach((value) => {
              let obj1 = new SectorQuestionDetailsEntity(
                insertedData.id,
                ele,
                value,
                '', 
                systemUserId,
              );
              arr.push(obj1);
            });
          }
        
        
          await this.sectorQuestionDaoService.createSectorQuestionDetails(arr);
        }
        
       
    }
    if (createSectorQuestionDto.kpiId) {
      await this.kpiDaoService.updateKpiWhenQuestionCreate(
        createSectorQuestionDto.kpiId,
        true,
        false
      );
    } else if (createSectorQuestionDto.topicId) {
      await this.topicDaoService.updateTopicWhenQuestionCreate(
        createSectorQuestionDto.topicId,
        true,      
      );
    } else {
      await this.frameworkDaoService.updateFrameworkWhenQuestionCreate(
        createSectorQuestionDto.frameworkId,
       true
      );
    }
 {
    throw new HttpException(
      {
        status: 200,
        message: 'Created successfully',
      },
      HttpStatus.OK,
    );
  }
  }
}
