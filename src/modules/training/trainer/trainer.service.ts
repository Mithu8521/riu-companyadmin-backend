import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateTrainingDto, TrainerDto } from './dto/create-training.dto';
import { UpdateTrainingDto } from './dto/update-trainer.dto';
import { DeleteTrainingDto } from './dto/delete-training.dto';
import { TrainingDaoService } from '@modules/dao/training/training-dao/training-dao.service';
import { Training } from './entities/training.entity';
import { ModeOfTraining } from '@utils/enums/Status';
import * as md5 from 'md5';
import { AddTraineeAndInviteTraineeDto } from './dto/add-trainee-and-Invite-trainee.dto';
import { UserDaoService } from '@modules/dao/setting/user-dao/user-dao.service';
import { SendMailService } from '@utils/common/send-mail/send-mail.service';
import * as QRCode from 'qrcode';
import { InvitedTrainee } from './entities/invited-trainee.entity';
import { TraineeDaoService } from '@modules/dao/training/trainee-dao/trainee-dao.service';
import { UserActivityLog } from '@modules/setting/user/entities/user_activity_logs';
import { CreateTopicDto } from './dto/create-topic.dto';
import { TrainingTopic } from './entities/training-topic.entity';
import { ExternalApiCallService } from '@utils/common/external-api-call/external-api-call.service';
import { RemoveUsersFromTrainingBulkDto } from './dto/remove-user.dto';
const baseUrl = process.env.BASE_URL5;
const frontendBaseUrl = process.env.BASE_URL6;
@Injectable()
export class TrainerService {
  constructor(private trainingDaoService: TrainingDaoService, private userDaoService: UserDaoService, private sendMailService: SendMailService, private traineeDaoService: TraineeDaoService, private externalApiCallService: ExternalApiCallService) { }

  async getTrainingData(req: any) {
    const systemUserId = req.headers.userid;
    const isHead = systemUserId == 122 || (await this.userDaoService.getCompanyDetailsBasedOnUserId(Number(systemUserId))).head_office;
    if (!req.query.financialYearId) {
      throw new HttpException({ status: 400, message: 'Financial Year not found ', }, HttpStatus.BAD_REQUEST);
    }
    let trainingListData;

    if (req.query.status === '2') {
      if (isHead) {
        trainingListData = await this.trainingDaoService.getHeadAllTriningList(
          Number(req.query.financialYearId),
          2
        );
      } else {
        trainingListData = await this.trainingDaoService.getAllTrainingList(
          Number(systemUserId),
          Number(req.query.financialYearId),
          2
        );
      }
    } else {
      if (isHead) {
        trainingListData = await this.trainingDaoService.getHeadAllTriningList(
          Number(req.query.financialYearId),
          1
        );
      } else {
        trainingListData = await this.trainingDaoService.getAllTrainingList(
          Number(systemUserId),
          Number(req.query.financialYearId),
          1
        );
      }

    }

    if (trainingListData) throw new HttpException({ status: 200, message: 'Data Found', data: trainingListData }, HttpStatus.OK);
  }

  async getTrainingTopicMapping(req: any) {
    const systemUserId = req.headers.userid;
    const trainingTopicMaping = await this.trainingDaoService.getTrainingTopicMapping();
    if (trainingTopicMaping) throw new HttpException({ status: 200, message: 'Data Found', data: trainingTopicMaping }, HttpStatus.OK);
  }

  async removeUsersFromTrainingInBulk(
    removeUsersFromTrainingBulkDto: RemoveUsersFromTrainingBulkDto,
  ) {
    try {
      const results = await this.trainingDaoService.removeUsersFromTrainingInBulk(
        removeUsersFromTrainingBulkDto.trainingUsers
      );

      return {
        success: results.successful > 0,
        message: `Processed ${results.total} training users: ${results.successful} successful, ${results.failed} failed`,
        results: results.data,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to remove users from training in bulk',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getTrainingCategory(req: any) {
    const systemUserId = req.headers.userid;
    const getCompany = await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId);

    const frameworkIds = (await this.externalApiCallService.getReq(
      process.env.COMPANY_SERVER_API_URL + 'getFramework',
      { companyId: getCompany.company_id, type: 'ALL', user_type_code: 'company' },
      {},
    )).data.map((obj) => obj.id);
    const queryParam = {
      company_id: getCompany.company_id,
      user_type_code: 'COMPANY',
      framework_ids: frameworkIds,
    };


    const getTraingCategory = await this.externalApiCallService.getReq(
      process.env.COMPANY_SERVER_API_URL + 'getTrainingCategories',
      queryParam,
      {},
    );
    if (getTraingCategory) throw new HttpException({ status: 200, message: 'Data Found', data: getTraingCategory.data.trainingCategories }, HttpStatus.OK);
  }

  async getTrainingPrinciples(req: any) {
    return {
      data: await this.trainingDaoService.getTrainingPrinciples()
    };
  }

  async getAllTrainingDataForFilter(req: any) {
    const systemUserId = req.headers.userid;
    const getCompany = await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId);

    const frameworkIds = (await this.externalApiCallService.getReq(
      process.env.COMPANY_SERVER_API_URL + 'getFramework',
      { companyId: getCompany.company_id, type: 'ALL', user_type_code: 'company' },
      {},
    )).data.map((obj) => obj.id);
    const queryParam = {
      company_id: getCompany.company_id,
      user_type_code: 'COMPANY',
      framework_ids: frameworkIds,
    };


    const getTraingCategory = await this.externalApiCallService.getReq(
      process.env.COMPANY_SERVER_API_URL + 'getTrainingCategories',
      queryParam,
      {},
    );
    const category = getTraingCategory.data.trainingCategories;
    const isHead = systemUserId == 122 || (await this.userDaoService.getCompanyDetailsBasedOnUserId(Number(systemUserId))).head_office;
    if (!req.query.financialYearId) {
      throw new HttpException({ status: 400, message: 'Financial Year not found ', }, HttpStatus.BAD_REQUEST);
    }
    let trainingListData;

    if (req.query.status === '2') {
      if (isHead) {
        trainingListData = await this.trainingDaoService.getHeadAllTrainingListWithUserDetails(
          Number(req.query.financialYearId),
          category,
          2,
          req.query.financialYearStartDate, req.query.financialYearEndDate
        );
      } else {
        trainingListData = await this.trainingDaoService.getAllTrainingListWithUserDetails(
          Number(systemUserId),
          Number(req.query.financialYearId),
          category,
          2,
          req.query.financialYearStartDate,
          req.query.financialYearEndDate
        );
      }
    } else {
      if (isHead) {
        trainingListData = await this.trainingDaoService.getHeadAllTrainingListWithUserDetails(
          Number(req.query.financialYearId),
          category,
          1,
          req.query.financialYearStartDate,
          req.query.financialYearEndDate
        );
      } else {
        trainingListData = await this.trainingDaoService.getAllTrainingListWithUserDetails(
          Number(systemUserId),
          Number(req.query.financialYearId),
          category,
          1,
          req.query.financialYearStartDate,
          req.query.financialYearEndDate
        );
      }

    }

    if (trainingListData) throw new HttpException({ status: 200, message: 'Data Found', data: trainingListData }, HttpStatus.OK);
  }

  async getAllTrainingDataForGraph(req: any) {
    const systemUserId = req.headers.userid;
    const getCompany = await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId);

    const frameworkIds = (await this.externalApiCallService.getReq(
      process.env.COMPANY_SERVER_API_URL + 'getFramework',
      { companyId: getCompany.company_id, type: 'ALL', user_type_code: 'company' },
      {},
    )).data.map((obj) => obj.id);
    const queryParam = {
      company_id: getCompany.company_id,
      user_type_code: 'COMPANY',
      framework_ids: frameworkIds,
    };


    const getTraingCategory = await this.externalApiCallService.getReq(
      process.env.COMPANY_SERVER_API_URL + 'getTrainingCategories',
      queryParam,
      {},
    );
    const category = getTraingCategory.data.trainingCategories;
    const isHead = systemUserId == 122 || (await this.userDaoService.getCompanyDetailsBasedOnUserId(Number(systemUserId))).head_office;
    if (!req.query.financialYearId) {
      throw new HttpException({ status: 400, message: 'Financial Year not found ', }, HttpStatus.BAD_REQUEST);
    }
    let trainingListData;

    if (req.query.status === '2') {
      if (isHead) {
        trainingListData = await this.trainingDaoService.getHeadAllTrainingListWithUserDetails(
          Number(req.query.financialYearId),
          category,
          2,
          req.query.financialYearStartDate,
          req.query.financialYearEndDate
        );
      } else {
        trainingListData = await this.trainingDaoService.getAllTrainingListWithUserDetails(
          Number(systemUserId),
          Number(req.query.financialYearId),
          category,
          2,
          req.query.financialYearStartDate,
          req.query.financialYearEndDate
        );
      }
    } else {
      if (isHead) {
        trainingListData = await this.trainingDaoService.getHeadAllTrainingListWithUserDetailsForGraph(
          Number(req.query.financialYearId),
          category,
          1,
          req.query.financialYearStartDate,
          req.query.financialYearEndDate
        );
      } else {
        trainingListData = await this.trainingDaoService.getAllTrainingListWithUserDetails(
          Number(systemUserId),
          Number(req.query.financialYearId),
          category,
          1, req.query.financialYearStartDate,
          req.query.financialYearEndDate
        );
      }

    }

    if (trainingListData) throw new HttpException({ status: 200, message: 'Data Found', data: trainingListData }, HttpStatus.OK);
  }

  async createNewTraining(createTrainingDto: CreateTrainingDto, req: any) {
    const systemUserId = req.headers.userid;
    const systemUserInfo = await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId);

    const { financialYearId, categoryIds, trainingTitle, trainingTopicID, principlesId, description, trainingFacilitator, trainers, departmentId, fromDate, toDate, fromTime,
      toTime, registrationDeadline, modeOfTraining, linkOrVenues, companyId } = createTrainingDto;
    const modeOfTrainings = modeOfTraining as ModeOfTraining;
    const timestamp = Date.now();
    const md5TimeStamp = md5(timestamp);
    const url = baseUrl + `${md5TimeStamp}`;
    const trainingEntity = this.createNewTrainingEntity(financialYearId, categoryIds, trainingTitle, trainingTopicID, principlesId, description, trainingFacilitator, trainers, departmentId, fromDate, toDate, fromTime,
      toTime, null, registrationDeadline, modeOfTrainings, linkOrVenues, url, md5TimeStamp, companyId, Number(systemUserId));
    const save = await this.trainingDaoService.saveNewTraining(trainingEntity);
    const internalRegisterUrl = `${frontendBaseUrl}trainee_registration/${md5TimeStamp}`;
    const internalMarkingUrl = `${frontendBaseUrl}trainee_invite/${md5TimeStamp}`;
    const externalRegisterUrl = `${frontendBaseUrl}external_register/${md5TimeStamp}`;
    const externalMarkingUrl = `${frontendBaseUrl}external_attendence/${md5TimeStamp}`;
    const qrInternalRegisterCodeImage = await QRCode.toDataURL(internalRegisterUrl);
    const qrInternalAttendenceCodeImage = await QRCode.toDataURL(internalMarkingUrl);
    const qrExternalRegisterCodeImage = await QRCode.toDataURL(externalRegisterUrl);
    const qrExternalAttendenceCodeImage = await QRCode.toDataURL(externalMarkingUrl);
    const updates = await this.trainingDaoService.updateTrainingQRData(save.id, qrInternalRegisterCodeImage, qrInternalAttendenceCodeImage, qrExternalRegisterCodeImage, qrExternalAttendenceCodeImage);
    if (save) {
      const activityLog = UserActivityLog.createLog(
        `Training created - ${trainingTitle}`,
        'Training Creation',
        'success',
        systemUserId,
        save.id,
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
      throw new HttpException({ status: 200, message: 'Training Successfully Created' }, HttpStatus.OK);
    }
  }

  async createNewTopic(createTopicDto: CreateTopicDto, req: any) {
    const systemUserId = req.headers.userid;

    if (!systemUserId) {
      throw new HttpException(
        { status: 400, message: 'User ID is required in headers' },
        HttpStatus.BAD_REQUEST
      );
    }

    const systemUserInfo = await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId);

    if (!systemUserInfo) {
      throw new HttpException(
        { status: 404, message: 'User not found' },
        HttpStatus.NOT_FOUND
      );
    }

    const { topic, principles } = createTopicDto;

    if (!topic || !principles) {
      throw new HttpException(
        { status: 400, message: 'Topic and principles are required' },
        HttpStatus.BAD_REQUEST
      );
    }

    const newTrainingTopic = new TrainingTopic(
      topic,
      principles,
      parseInt(systemUserId)
    );
    const savedTopic = await this.trainingDaoService.saveNewTopic(newTrainingTopic);
    throw new HttpException({ status: 200, message: 'Training Topic Successfully Created' }, HttpStatus.OK);

  }

  async updateTraining(updateTrainingDto: UpdateTrainingDto, req: any) {
    const systemUserId = req.headers.userid;
    const systemUserInfo = await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId);

    const { trainingId, financialYearId, categoryIds, trainingTitle, trainingTopicID, principlesId, description, trainingFacilitator, trainers, departmentId, fromDate, toDate, fromTime,
      toTime, registrationDeadline, modeOfTraining, linkOrVenues, companyId } = updateTrainingDto;
    const traningExitingData = await this.trainingDaoService.getExitingTrainingData(Number(trainingId));
    if (traningExitingData) {
      const changedFields = [];
      if (trainingTitle !== traningExitingData.trainingTitle) changedFields.push('title');
      if (trainingTopicID !== traningExitingData.trainingTopicID) changedFields.push('topic');
      if (description !== traningExitingData.description) changedFields.push('description');
      if (fromDate !== traningExitingData.fromDate) changedFields.push('dates');
      if (modeOfTraining !== traningExitingData.modeOfTraining) changedFields.push('mode');
      if (trainers !== traningExitingData.trainers) changedFields.push('trainers');
      const modeOfTrainings = modeOfTraining as ModeOfTraining;

      const trainingEntity = this.updateTrainingEntity(financialYearId, categoryIds, trainingTitle, trainingTopicID, principlesId, traningExitingData.userId, traningExitingData.acceptedUserId, traningExitingData.nonAcceptedUserId, traningExitingData.attendantUserId,
        traningExitingData.nonAttendantUserId, description, trainingFacilitator, trainers, departmentId, fromDate, toDate, fromTime,
        toTime, null, registrationDeadline, modeOfTrainings, linkOrVenues, traningExitingData.trainingLink, traningExitingData.token, traningExitingData.registerInternalQrLink, traningExitingData.registerExternalQrLink, traningExitingData.attendenceInternalQrLink, traningExitingData.attendenceExternalQrLink, companyId, traningExitingData.createdBy);
      const updated = await this.trainingDaoService.updateTrainingData(Number(trainingId), trainingEntity);
      if (traningExitingData.userId.length) {
        this.createUpdatedInvitedTrainee(traningExitingData.userId, traningExitingData)
      }
      if (updated) {
        const changesSummary = changedFields.length > 0
          ? changedFields.join(', ')
          : 'details';

        // Create activity log for training update
        const activityLog = UserActivityLog.createLog(
          `Training updated - ${trainingTitle} (${changesSummary})`,
          'Training Update',
          'success',
          systemUserId,
          trainingId,
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
        throw new HttpException({ status: 200, message: 'Training Successfully Updated' }, HttpStatus.OK);
      }
    } else {
      throw new HttpException({ status: 400, message: 'Training Not Created' }, HttpStatus.BAD_REQUEST);
    }
  }

  async deleteTrainingData(deleteTrainingDto: DeleteTrainingDto, req: any) {
    const systemUserId = req.headers.userid;
    const systemUserInfo = await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId);

    const { trainingId, status } = deleteTrainingDto;
    if (!trainingId) {
      throw new HttpException({ status: 400, message: 'Training Id Required' }, HttpStatus.BAD_REQUEST);
    } else {
      const traningExitingData = await this.trainingDaoService.getExitingTrainingData(Number(trainingId));
      if (traningExitingData) {
        const updated = await this.trainingDaoService.updateTrainingStatus(Number(trainingId), status);
        if (updated) {
          const actionType = status === 0 ? 'Deleted' : 'Cancelled';

          // Create activity log for training deletion/cancellation
          const activityLog = UserActivityLog.createLog(
            `Training ${actionType} - ${traningExitingData.trainingTitle}`,
            `Training ${status === 0 ? 'Deletion' : 'Cancellation'}`,
            'success',
            systemUserId,
            trainingId,
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
          throw new HttpException({
            status: 200, message: `Training Successfully ${status === 0 ? 'Deleted' : 'Cancelled'}`,
          },
            HttpStatus.OK,
          );
        }
      } else {
        throw new HttpException({ status: 400, message: 'Training Not Created' }, HttpStatus.BAD_REQUEST);
      }
    }
  }

  async addTraineeOrInviteTrainee(body: AddTraineeAndInviteTraineeDto, req: any) {
    const systemUserId = req.headers.userid;
    const systemUserInfo = await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId);

    const { trainingId, traineeEmails } = body;
    const trainingUser = await this.userDaoService.getCompanyDetailsBasedOnUserId(Number(systemUserId));
    if (!trainingId && !trainingUser) {
      throw new HttpException({ status: 400, message: 'Training Id Required' }, HttpStatus.BAD_REQUEST);
    } else {
      const trainingExitingData = await this.trainingDaoService.getExitingTrainingData(Number(trainingId));

      if (trainingExitingData) {
        this.addTraineeOrSendInvite(traineeEmails, trainingExitingData, trainingUser);
        const traineeCount = traineeEmails.length;

        // Create activity log for adding trainees
        const activityLog = UserActivityLog.createLog(
          `Trainees added to training - ${trainingExitingData.trainingTitle} (${traineeCount} trainees)`,
          'Training Invitation',
          'success',
          systemUserId,
          trainingId,
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
        throw new HttpException({ status: 200, message: 'Trainee Successfully Added' }, HttpStatus.OK);
      } else {
        throw new HttpException({ status: 400, message: 'Training Not Created' }, HttpStatus.BAD_REQUEST);
      }
    }
  }

  async getTraineeEmail(req: any) {
    const userId = req.query.id;
    const trainingListData = await this.trainingDaoService.getInvitedEmail(Number(userId));
    if (trainingListData) throw new HttpException({ status: 200, message: 'Data Found', data: trainingListData }, HttpStatus.OK);
  }

  async getTraineeData(req: any) {
    const token = req.query.token;
    if (!token) {
      throw new HttpException(
        { status: 400, message: 'Token is required' },
        HttpStatus.BAD_REQUEST
      );
    }

    const trainingExitingData = await this.traineeDaoService.getExitingTrainingDataBasedOnToken(token);

    if (!trainingExitingData) {
      throw new HttpException(
        { status: 404, message: 'No training data found for the given token' },
        HttpStatus.NOT_FOUND
      );
    }
    throw new HttpException({ status: 200, message: 'Data Found', data: trainingExitingData }, HttpStatus.OK);
  }

  async getTraineeUserData(req: any) {
    const id = req.query.id;
    if (!id) {
      throw new HttpException(
        { status: 400, message: 'Training Id is required' },
        HttpStatus.BAD_REQUEST
      );
    }

    const trainingExitingData = await this.trainingDaoService.getExitingTrainingData(id);

    const registerUser = await this.trainingDaoService.getExitingRegisterTrainingData(trainingExitingData.userId, req.query.financialYearStartDate, req.query.financialYearEndDate);
    const attendenceUser = await this.trainingDaoService.getExitingRegisterTrainingData(trainingExitingData.attendantUserId, req.query.financialYearStartDate, req.query.financialYearEndDate);
    throw new HttpException({ status: 200, message: 'Data Found', data: { registerUser, attendenceUser } }, HttpStatus.OK);


  }

  private async addTraineeOrSendInvite(traineeEmails: string[], trainingExitingData: any, trainingUser: any) {
    for (const email of traineeEmails) {
      const user = await this.userDaoService.getUser({ email: email });
      const trainer =
        Array.isArray(trainingExitingData.trainers)
          ? trainingExitingData.trainers.map(t => t.name).join(", ")
          : trainingExitingData.trainers || ""
      if (user) {
        const updatedUserId = [...new Set([...trainingExitingData.userId, user.id])];
        await this.trainingDaoService.updateUserId(trainingExitingData.id, updatedUserId);
        const invitedTrainee = this.createNewInvitedTraineeEntity(email);
        const inserted = await this.trainingDaoService.saveNewInvitedTrainee(invitedTrainee);
        const tokenlink = trainingExitingData?.trainingLink + '&' + inserted.id;
        const userInformation = {
          name: 'Trainee',
          email,
          trainer: trainer,
          topicTitle: trainingExitingData.trainingTitle,
          date: new Date(trainingExitingData.date).toLocaleDateString(),
          time: trainingExitingData.fromTime + ' To ' + trainingExitingData.toTime,
          mettingLink: trainingExitingData.linkOrVenues,
        };
        const payload = {
          emailData: {
            userDetails: userInformation,
            templatePath: '/../../../public/views/templates/invite-trainee.html',
            subject: 'Welcome to RIU',
            url: tokenlink,
            password: 'email',
          },
        };
        const emailHistory = await this.userDaoService.insertNewEmailHistory(
          email,
          "INVITE_TRAINEE",
          false,
          payload
        );
        const emailStatus = await this.sendMailService.sendingMail(
          userInformation,
          '/../../../public/views/templates/invite-trainee.html',
          'Welcome to RIU',
          tokenlink,
          'email'
        );

        await this.userDaoService.updateStatusEmailHistory(
          emailHistory.id,
          emailStatus
        );
      } else {
        const invitedTrainee = this.createNewInvitedTraineeEntity(email);
        const inserted = await this.trainingDaoService.saveNewInvitedTrainee(invitedTrainee);
        const tokenlink = trainingExitingData?.trainingLink + '&' + inserted.id;
        const userInformation = {
          name: 'Trainee',
          email,
          trainer: trainer,
          topicTitle: trainingExitingData.trainingTitle,
          date: new Date(trainingExitingData.date).toLocaleDateString(),
          time: trainingExitingData.fromTime + ' To ' + trainingExitingData.toTime,
          mettingLink: trainingExitingData.linkOrVenues,
        };
        const payload = {
          emailData: {
            userDetails: userInformation,
            templatePath: '/../../../public/views/templates/invite-trainee.html',
            subject: 'Welcome to RIU',
            url: tokenlink,
            password: 'email',
          },
        };
        const emailHistory = await this.userDaoService.insertNewEmailHistory(
          email,
          "INVITE_TRAINEE",
          false,
          payload
        );
        const emailStatus = await this.sendMailService.sendingMail(
          userInformation,
          '/../../../public/views/templates/invite-trainee.html',
          'Welcome to RIU',
          tokenlink,
          'email'
        );


        await this.userDaoService.updateStatusEmailHistory(
          emailHistory.id,
          emailStatus
        );
      }
    }
  }

  private createNewTrainingEntity(financialYearId: number, categoryIds: number[], trainingTitle: string, trainingTopicID: number[], principlesId: number[], description: string, trainingFacilitator: string, trainers: TrainerDto[], departmentId: number,
    fromDate: string, toDate: string, fromTime: string, toTime: string, targetAudience: string, registrationDeadLine: string, modeOfTrainings: ModeOfTraining, linkOrVenues: string, url: string, token: string, companyId: number, createdBy: number): Training {
    return new Training(financialYearId, trainingTitle, categoryIds, trainingTopicID, principlesId, [], 1, [], [], [], [], description, trainingFacilitator, trainers, departmentId, fromDate, toDate, fromTime,
      toTime, targetAudience, registrationDeadLine, modeOfTrainings, linkOrVenues, url, token, null, null, null, null, companyId, createdBy, 1);
  }

  private updateTrainingEntity(financialYearId: number, categoryIds: number[], trainingTitle: string, trainingTopicID: number[], principlesId: number[], userId: number[], acceptedUserId: number[], nonAcceptedUserId: number[], attendantUserId: number[], nonAttendantUserId: number[], description: string, trainingFacilitator: string, trainers: TrainerDto[], departmentId: number,
    fromDate: string, toDate: string, fromTime: string, toTime: string, targetAudience: string, registrationDeadLine: string, modeOfTrainings: ModeOfTraining, linkOrVenues: string, url: string, token: string, registerInternalQrLink, registerExternalQrLink, attendenceInternalQrLink, attendenceExternalQrLink, companyId: number, createdBy: number): Training {
    return new Training(financialYearId, trainingTitle, categoryIds, trainingTopicID, principlesId, userId, 1, acceptedUserId, nonAcceptedUserId, attendantUserId, nonAttendantUserId, description, trainingFacilitator, trainers, departmentId, fromDate, toDate, fromTime,
      toTime, targetAudience, registrationDeadLine, modeOfTrainings, linkOrVenues, url, token, registerInternalQrLink, registerExternalQrLink, attendenceInternalQrLink, attendenceExternalQrLink, companyId, createdBy, 1);
  }

  private async createUpdatedInvitedTrainee(userIds: number[], trainingExitingData: any) {
    for (const id of userIds) {
      const user = await this.userDaoService.getTraineeUser(id);
      if (user.emailId) {
        const tokenlink = trainingExitingData?.internalRegisterUrl;
        const trainer =
          Array.isArray(trainingExitingData.trainers)
            ? trainingExitingData.trainers.map(t => t.name).join(", ")
            : trainingExitingData.trainers || ""
        const userInformation = {
          name: 'Trainee',
          email: user.emailId,
          trainer: trainer,
          topicTitle: trainingExitingData.trainingTitle,
          date: new Date(trainingExitingData.fromDate).toLocaleDateString() + ' To ' + new Date(trainingExitingData.toDate).toLocaleDateString(),
          time: trainingExitingData.fromTime + ' To ' + trainingExitingData.toTime,
          mettingLink: trainingExitingData.linkOrVenues,
        };
        const payload = {
          emailData: {
            userDetails: userInformation,
            templatePath: '/../../../public/views/templates/invite-trainee.html',
            subject: 'Welcome to RIU',
            url: tokenlink,
            password: 'email',
          },
        };
        const emailHistory = await this.userDaoService.insertNewEmailHistory(
          user.emailId,
          "UPDATE_TRAINEE",
          false,
          payload
        );
        const emailStatus = await this.sendMailService.sendingMail(
          userInformation,
          '/../../../public/views/templates/invite-trainee.html',
          'Welcome to RIU',
          tokenlink,
          'email'
        );


        await this.userDaoService.updateStatusEmailHistory(
          emailHistory.id,
          emailStatus
        );
      }
    }
  }

  private createNewInvitedTraineeEntity(email: string): InvitedTrainee {
    return new InvitedTrainee(email);
  }

}
