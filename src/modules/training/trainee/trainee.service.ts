import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { TraineeDaoService } from '@modules/dao/training/trainee-dao/trainee-dao.service';
import { SignInTraineeDto } from './dto/signin-trainee.dto';
import { SignUpTraineeDto } from './dto/signup-trainee.dto';
import { CompanyEntity } from '@modules/setting/user/entities/user.entity';
import { Gender, QuestionnaireType, QuestionStatus, QuestionType, UserType } from '@utils/enums/Status';
import { UserDaoService } from '@modules/dao/setting/user-dao/user-dao.service';
import { TrainingDaoService } from '@modules/dao/training/training-dao/training-dao.service';
import { GenerateUpdateTokenService } from '@utils/utility-function/generate-update-token/generate-update-token.service';
import { ValidateTraineeDto } from './dto/validate-trainee.dto';
import * as bcrypt from 'bcrypt';
import { ValidateInvitationTrainingDto } from './dto/validate-invitation-status';
import { RoleMasterDaoService } from '@modules/dao/setting/role-master-dao/role-master-dao.service';
import { SignUpExternalTraineeDto } from './dto/external-trainee-resister.dto';
import { TraineeUser } from './entities/external-trainee-resister.entity';
import { UserActivityLog } from '@modules/setting/user/entities/user_activity_logs';
import { BulkSignUpTraineeDto } from './dto/bulk-SignUp-trainee.dto';
import { CommonUtilityService } from '@utils/common/common-utility/common-utility.service';
import { SendMailService } from '@utils/common/send-mail/send-mail.service';
import { UploadParticipantDto } from './dto/upload-participant-dto';
import { ReportingModuleService } from '@modules/reporting_module/reporting_module.service';
import { ExternalApiCallService } from '@utils/common/external-api-call/external-api-call.service';
import { SectorQuestionDaoModuleService } from '@modules/dao/sector-question-dao-module/sector-question-dao-module.service';
import { SectorQuestionTabularHistoryAnswerEntity } from '@modules/sector_question/entities/sector_tabular_question_answer_history.entity';
import { SectorQuestionTabularAnswerEntity } from '@modules/sector_question/entities/sector_tabular_question_answer.entity';
import { ReportingModuleDaoService } from '@modules/dao/reporting-module-dao/reporting-module-dao.service';
import { ReportingQuestionAnswerEntity } from '@modules/reporting_module/entities/reporting_question_answer.entity';
import { toDate } from 'date-fns';
const url = process.env.BASE_URL4;
class ParticipantResult {
  trainingId: number;
  status: string;
  success: boolean;
  message: string;
}
class TraineeResult {
  email: string;
  employeeId: string;
  success: boolean;
  message: string;
}
@Injectable()
export class TraineeService {
  constructor(private traineeDaoService: TraineeDaoService, private userDaoService: UserDaoService, private trainingDaoService: TrainingDaoService, private generateUpdateTokenService: GenerateUpdateTokenService,
    private roleMasterDaoService: RoleMasterDaoService, private commonUtilityService: CommonUtilityService, private sendMailService: SendMailService, private externalApiCallService: ExternalApiCallService, private sectorQuestionDaoModuleService: SectorQuestionDaoModuleService, private reportingModuleDaoService: ReportingModuleDaoService
  ) { }

  async getTraineeData(req: any) {
    const systemUserId = req.headers.userid;
    const { type, financialYearId } = req.query;
    if (!financialYearId) {
      throw new HttpException({ status: 400, message: 'Financial Year not found ', }, HttpStatus.BAD_REQUEST);
    }
    let trainingListData = [];
    if (type === 'REGISTERED') {
      trainingListData = await this.traineeDaoService.getAllRegisteredTrainingList(Number(systemUserId), Number(financialYearId));
    } else if (type === 'COMPLETED') {
      trainingListData = await this.traineeDaoService.getAllAttentdantTrainingList(Number(systemUserId), Number(financialYearId));
    } else if (type === 'NOT_COMPLETED') {
      trainingListData = await this.traineeDaoService.getAllNonAttentdantTrainingList(Number(systemUserId), Number(financialYearId));
    } else if (type === 'HISTORY') {
      trainingListData = await this.traineeDaoService.getHistoryTrainings(Number(systemUserId), Number(financialYearId));
    } else if (type === 'UPCOMING') {
      trainingListData = await this.traineeDaoService.getUpcomingTrainings(Number(systemUserId), Number(financialYearId));
    } else if (type === 'ALL') {
      trainingListData = await this.traineeDaoService.getAllTrainingListByUserId(Number(systemUserId), Number(financialYearId));
    }
    if (trainingListData) throw new HttpException({ status: 200, message: 'Data Found', data: trainingListData }, HttpStatus.OK);
  }

  async getAllRegisteredTrainee(req: any) {
    const traineeListData = req.query.companyName ? await this.traineeDaoService.getRegisteredTraineesBasedOnCompanys(req.query.companyName, req.query.financialYearStartDate, req.query.financialYearEndDate) :
      await this.traineeDaoService.getAllRegisteredTrainees(req.query.financialYearStartDate, req.query.financialYearEndDate);
    if (traineeListData) throw new HttpException({ status: 200, message: 'Data Found', data: traineeListData }, HttpStatus.OK);
  }

  async validatedTrainingStatus(body: ValidateTraineeDto, req: any) {
    const systemUserId = req.headers.userid;
    const { trainingId, trainingStatus } = body;
    const systemUserInfo = await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId);

    const trainingExitingData = await this.trainingDaoService.getExitingTrainingData(trainingId);
    const userExitingData = await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId);
    if (trainingExitingData && userExitingData) {
      let actionType = '';
      let statusText = '';
      if (trainingStatus === 'ATTENDANT') {
        const updatedUserId = [...new Set([...trainingExitingData.attendantUserId, Number(systemUserId)])];
        await this.trainingDaoService.updateAttendantUserId(trainingExitingData.id, updatedUserId);
        this.updateTrainingData(trainingExitingData["financialYearId"]);
        this.updateTrainingCovarageData(trainingExitingData["financialYearId"]);
        this.updateTrainingHumanRightData(trainingExitingData["financialYearId"]);

        actionType = 'Training Attendance';
        statusText = 'attended';

        // Create activity log for marking attendance
        const activityLog = UserActivityLog.createLog(
          `Marked as ${statusText} - ${trainingExitingData.trainingTitle}`,
          actionType,
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
        await this.userDaoService.insertTodaysActivityData(activityLog);

        throw new HttpException({ status: 200, message: 'Validated', }, HttpStatus.OK);
      } else if (trainingStatus === 'NON_ATTENDANT') {
        const updatedUserId = [...new Set([...trainingExitingData.userId, Number(systemUserId)])];
        await this.trainingDaoService.updateNonAttendantUserId(trainingExitingData.id, updatedUserId);
        actionType = 'Training Non-Attendance';
        statusText = 'not attended';

        // Create activity log for marking non-attendance
        const activityLog = UserActivityLog.createLog(
          `Marked as ${statusText} - ${trainingExitingData.trainingTitle}`,
          actionType,
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
        throw new HttpException({ status: 200, message: 'Valideted', }, HttpStatus.OK);

      }
    }
  }

  async validatedInvitedTraining(body: ValidateInvitationTrainingDto, req: any) {
    const systemUserId = req.headers.userid;
    const systemUserInfo = await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId);

    const { trainingId, invitationTrainingStatus } = body;
    const trainingExitingData = await this.trainingDaoService.getExitingTrainingData(trainingId);
    const userExitingData = await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId);
    if (trainingExitingData && userExitingData) {

      let actionType = '';
      let statusText = '';

      if (invitationTrainingStatus === 'ACCEPTED') {
        const updatedUserId = [...new Set([...trainingExitingData.acceptedUserId, Number(systemUserId)])];
        await this.trainingDaoService.updateAcceptedUserId(trainingExitingData.id, updatedUserId);
        actionType = 'Training Invitation Response';
        statusText = 'accepted';

        // Create activity log for accepting training invitation
        const activityLog = UserActivityLog.createLog(
          `Training invitation ${statusText} - ${trainingExitingData.trainingTitle}`,
          actionType,
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

        throw new HttpException({ status: 200, message: 'Accepted', }, HttpStatus.OK);
      } else if (invitationTrainingStatus === 'REJECTED') {
        const updatedUserId = [...new Set([...trainingExitingData.nonAcceptedUserId, Number(systemUserId)])];
        await this.trainingDaoService.updateNonAcceptedUserId(trainingExitingData.id, updatedUserId);
        actionType = 'Training Invitation Response';
        statusText = 'declined';

        // Create activity log for declining training invitation
        const activityLog = UserActivityLog.createLog(
          `Training invitation ${statusText} - ${trainingExitingData.trainingTitle}`,
          actionType,
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
        throw new HttpException({ status: 200, message: 'Rejected', }, HttpStatus.OK);

      }
    }
  }

  async uploadParticipant(body: UploadParticipantDto, req: any) {
    const systemUserId = req.headers.userid;

    const systemUserInfo = await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId);

    const { trainingParticipants, status } = body;
    const results: ParticipantResult[] = [];
    let totalProcessed = 0;
    let successful = 0;
    let failed = 0;

    // Process all training participants
    for (const training of trainingParticipants) {
      const trainingId = training.trainingId;
      const userIds = training.userId;

      // Get training data
      const trainingData = await this.trainingDaoService.getExitingTrainingData(trainingId);
      if (!trainingData) {
        // Skip if training doesn't exist
        userIds.forEach(userId => {
          results.push({
            trainingId,
            status: 'FAILED',
            success: false,
            message: 'Training not found'
          });
          failed++;
          totalProcessed++;
        });
        continue;
      }

      for (const statusValue of status) {
        try {
          let actionType = '';
          let statusText = '';
          let handled = false;

          // Handle REGISTERED status (map to ATTENDANT for DB)
          if (statusValue === 'REGISTERED') {
            const updatedUserId = [...new Set([...trainingData.attendantUserId || [], ...userIds])];
            await this.trainingDaoService.updateUserId(trainingData.id, updatedUserId);
            await this.trainingDaoService.updateAcceptedUserId(trainingData.id, updatedUserId);
            actionType = 'Training Registration';
            statusText = 'registered';
            handled = true;
          }

          // Handle COMPLETED status (this could map to ACCEPTED or another status)
          if (statusValue === 'COMPLETED') {
            const updatedUserId = [...new Set([...trainingData.acceptedUserId || [], ...userIds])];
            await this.trainingDaoService.updateAttendantUserId(trainingData.id, updatedUserId);

            actionType = 'Training Completion';
            statusText = 'completed';
            handled = true;
          }

          if (handled) {


            results.push({
              trainingId,
              status: statusValue,
              success: true,
              message: `Successfully marked as ${statusText}`
            });
            successful++;
            totalProcessed++;
          }
        } catch (error) {
          results.push({
            trainingId,
            status: statusValue,
            success: false,
            message: error.message || 'Failed to update status'
          });
          failed++;
          totalProcessed++;
        }
      }
    }
    // Create activity log
    const activityLog = UserActivityLog.createLog(
      `Bulk Upload data for Participates `,
      "Bulk Upload",
      'success',
      systemUserId, // System user who is doing the bulk upload
      systemUserId,
      {
        questionId: null,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        location: null,
        viewableChanges: null,
        metadata: {
          // Standard fields always present
          updatedBy: {
            id: systemUserId,
            name: `${systemUserInfo.first_name || ''} ${systemUserInfo.last_name || ''}`.trim(),
            email: systemUserInfo.email,
          },

          updated_time: new Date().toISOString()
        }
      }
    );

    await this.userDaoService.insertTodaysActivityData(activityLog);
    throw new HttpException({
      status: 200,
      message: 'Uploaded Successfully !!',
      data: {
        totalProcessed,
        successful,
        failed,
        results
      }
    }, HttpStatus.OK);

  }

  async markAttendenceExternalTrainee(req: any) {
    const { id, token } = req.body;
    if (!id || !token) {
      throw new HttpException({ status: 400, message: 'First Name, Mobile Number, and Token are mandatory.' }, HttpStatus.BAD_REQUEST);
    }

    const userExitingData = await this.traineeDaoService.getExitingUserBasedId(id);
    if (!userExitingData) {
      throw new HttpException({ status: 400, message: 'Not Registered!!' }, HttpStatus.OK);
    }

    const trainingExitingData = await this.traineeDaoService.getExitingTrainingDataBasedOnToken(token);

    if (trainingExitingData) {
      const updatedUserId = [...new Set([...trainingExitingData.attendantUserId, Number(id)])];
      await this.trainingDaoService.updateAttendantUserId(trainingExitingData.id, updatedUserId);
      throw new HttpException({ status: 200, message: 'Validated', }, HttpStatus.OK);
    } else {
      throw new HttpException({ status: 400, message: 'Invalid Code' }, HttpStatus.BAD_REQUEST);
    }
  }

  async getExternalTrainee(req: any) {
    const { firstName, mobileNumber, token } = req.query;
    if (!firstName || !mobileNumber || !token) {
      throw new HttpException({ status: 400, message: 'First Name, Mobile Number, and Token are mandatory.' }, HttpStatus.BAD_REQUEST);
    }

    const userExitingData = await this.traineeDaoService.getExitingUser(firstName, mobileNumber);
    if (!userExitingData) {
      throw new HttpException({ status: 400, message: 'Not Registered!!' }, HttpStatus.OK);
    }

    const trainingExitingData = await this.traineeDaoService.getExitingTrainingDataBasedOnToken(token);

    if (trainingExitingData.userId.includes(userExitingData.id)) {
      throw new HttpException({ status: 200, message: 'Fetch Successfully !!', data: userExitingData }, HttpStatus.OK);
    } else {
      throw new HttpException({ status: 400, message: 'Invalid Code' }, HttpStatus.BAD_REQUEST);
    }
  }

  async signupExternalTrainee(body: SignUpExternalTraineeDto, req: any) {
    const { employeeId, email, firstName, token, lastName, gender, mobileNumber, companyName } = body;
    const trainingExitingData = await this.traineeDaoService.getExitingTrainingDataBasedOnToken(token);
    if (trainingExitingData) {
      const userExitingData = await this.traineeDaoService.getExitingUser(firstName, mobileNumber);
      if (userExitingData) {
        const updatedUserId = [...new Set([...trainingExitingData.userId, userExitingData.id])];
        const updatedTraining = await this.trainingDaoService.updateUserId(trainingExitingData.id, updatedUserId);
        if (updatedTraining) throw new HttpException({ status: 200, message: 'Registered Successfully !!' }, HttpStatus.OK,);
      } else {
        const userEntity = this.createNewTraineeUserEntity(employeeId, email, firstName, lastName, gender, mobileNumber, companyName);
        const save = await this.traineeDaoService.inserTraineeData(userEntity);
        const updatedUserId = [...new Set([...trainingExitingData.userId, save.id])];
        const updatedTraining = await this.trainingDaoService.updateUserId(trainingExitingData.id, updatedUserId);
        if (updatedTraining) throw new HttpException({ status: 200, message: 'Registered Successfully !!' }, HttpStatus.OK,);
      }
    } else
      throw new HttpException({ status: 400, message: 'Invalid Code' }, HttpStatus.BAD_REQUEST);
  }

  async signupTrainee(body: SignUpTraineeDto, req: any) {
    const { employeeId, email, password, firstName, token, lastName, userType, gender, categoryId, departmentId, companyName, businessUnit, division,joiningDate } = body;
    // const trainingExitingData = await this.traineeDaoService.getExitingTrainingDataBasedOnToken(token);
    const userExitingData = await this.userDaoService.getUser({ email: email, employeeId: employeeId });
    if (userExitingData) {
      throw new HttpException({ status: 200, message: 'Already registered user' }, HttpStatus.OK);
    } else {
      const headUser = await this.userDaoService.getHeadOfficeCompanyDetails(true);
      const Role = await this.roleMasterDaoService.getRoleBasedOnRoleName('Trainee');
      const hashedPassword = bcrypt.hashSync(password, 8);
      const userEntity = this.createNewUserEntity(headUser.company_id, employeeId, email, hashedPassword, firstName, lastName, userType, gender, categoryId, departmentId, Role.length ? Role[0].id : 1,
        companyName, headUser.frequency, businessUnit, division,joiningDate);
      const save = await this.userDaoService.inserCompanyData(userEntity);
      // const updatedUserId = [...new Set([...trainingExitingData.userId, save.id])];
      // const updatedTraining = await this.trainingDaoService.updateUserId(trainingExitingData.id, updatedUserId);
      throw new HttpException({ status: 200, message: 'Registered Successfully !!', company_id: save.company_id, }, HttpStatus.OK,);
    }
  }

  async signupBulkTrainee(body: BulkSignUpTraineeDto, req: any) {
    const { trainees, userType } = body;

    const headUser = await this.userDaoService.getHeadOfficeCompanyDetails(true);
    const Role = await this.roleMasterDaoService.getRoleBasedOnRoleName('Trainee');
    const roleId = Role.length ? Role[0].id : 1;

    const defaultPassword = await this.commonUtilityService.generateRandomPassword(10);
    const hashedPassword = bcrypt.hashSync(defaultPassword, 8);

    const results: TraineeResult[] = [];

    for (const trainee of trainees) {
      try {
        const userExistingData = await this.userDaoService.getUser({ email: trainee.email, employeeId: trainee.employeeId });

        if (userExistingData) {
          results.push({
            email: trainee.email,
            employeeId: trainee.employeeId,
            success: false,
            message: 'Already registered user'
          });
        } else {
          // Convert joiningDate string to Date object if provided
          let joiningDateObj: Date | null = null;
          if (trainee.joiningDate) {
            try {
              joiningDateObj = new Date(trainee.joiningDate);
              // Validate that the date is valid
              if (isNaN(joiningDateObj.getTime())) {
                throw new Error('Invalid joining date format');
              }
            } catch (dateError) {
              results.push({
                email: trainee.email,
                employeeId: trainee.employeeId,
                success: false,
                message: `Invalid joining date format: ${trainee.joiningDate}`
              });
              continue; // Skip to next trainee
            }
          }

          const userEntity = this.createNewUserEntity(
            headUser.company_id,
            trainee.employeeId,
            trainee.email,
            hashedPassword,
            trainee.firstName,
            trainee.lastName || '',
            userType,
            trainee.gender,
            trainee.categoryId || null,
            trainee.departmentId,
            roleId,
            trainee.companyName,
            headUser.frequency,
            trainee.businessUnit,
            trainee.division,
            trainee.joiningDate, // Pass the joining date
          );

          const insertedData = await this.userDaoService.inserCompanyData(userEntity);

          results.push({
            email: trainee.email,
            employeeId: trainee.employeeId,
            success: true,
            message: 'Registered Successfully'
          });

          // Send email and log in background (non-blocking)
          await this.sendWelcomeEmailAndLog(trainee, userEntity, defaultPassword, req, userType, insertedData);
        }
      } catch (error) {
        results.push({
          email: trainee.email,
          employeeId: trainee.employeeId,
          success: false,
          message: error.message || 'Registration failed'
        });
      }
    }

    throw new HttpException({
      status: 200,
      message: 'Uploaded Successfully !!',
      data: {
        totalProcessed: trainees.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results: results
      }
    }, HttpStatus.OK);
  }

  async loginTrainee(body: SignInTraineeDto, req: any) {
    const { email, employeeId, password, token, userType } = body;
    const userExitingData = await this.userDaoService.getUser({ email: email, employeeId: employeeId });
    if (!userExitingData)
      throw new HttpException({ status: 403, notShowPopUp: true, message: 'Invalid credentials!', }, HttpStatus.FORBIDDEN,);

    if (userExitingData.status === false)
      throw new HttpException({ status: 403, message: 'Your account is deactivated. You can not perform any task' }, HttpStatus.FORBIDDEN,);
    else {
      const result = await this.userDaoService.comparePasswords(password, userExitingData.password);
      if (result) {
        let getName = userExitingData.first_name;
        if (userExitingData.last_name) {
          getName += ' ' + userExitingData.last_name;
        }
        const trainingExitingData = await this.traineeDaoService.getExitingTrainingDataBasedOnToken(token);
        const updatedUserId = [...new Set([...trainingExitingData.userId, userExitingData.id])];
        await this.trainingDaoService.updateUserId(trainingExitingData.id, updatedUserId);
        await this.generateUpdateTokenService.generateAndUpdateToken(body, userExitingData, req);
      } else
        throw new HttpException({ status: 403, message: 'Invalid credentials!' }, HttpStatus.FORBIDDEN,);
    }
  }

  private async sendWelcomeEmailAndLog(
    trainee: any,
    userDetails: any,
    password: string,
    req: any,
    userType: string,
    insertedCompanyDetails: any
  ) {
    try {
      if (!trainee.email) {
        throw new HttpException({ message: 'Cannot send welcome email, email is missing !!' }, HttpStatus.BAD_REQUEST);
      }

      const templatePath = '/../../../public/views/templates/welcomecopy.html';

      const payload = {
        emailData: {
          userDetails,
          templatePath,
          subject: 'Welcome to RIU',
          url,
          password
        }
      };
      const emailHistory = await this.userDaoService.insertNewEmailHistory(
        trainee.email,
        "TRAINEE_ADDED",
        false,
        payload
      );
      const emailStatus = await this.sendMailService.sendingMail(
        userDetails,
        templatePath,
        'Welcome to RIU',
        url,
        password
      );

      const systemUserId = req.headers.userid;
      const systemUserInfo = await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId);


      const activityLog = UserActivityLog.createLog(
        `${userType} invited - ${trainee.firstName} ${trainee.lastName || ''}`,
        `${userType} Invitation`,
        'success',
        systemUserId,
        insertedCompanyDetails.id,
        {
          questionId: null,
          ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
          userAgent: req.headers['user-agent'],
          location: null,
          viewableChanges: null,
          metadata: {
            name: `${systemUserInfo.first_name || ''} ${systemUserInfo.last_name || ''}`.trim(),
            email: systemUserInfo.email,
            invited_user: {
              id: insertedCompanyDetails.id,
              name: `${trainee.firstName} ${trainee.lastName || ''}`,
              email: trainee.email,
              mobile: trainee.mobileNumber || '',
              designation: trainee.designation || '',
              role_id: trainee.roleId || null,
              role_name: 'Trainee'
            },
            invited_by: {
              id: systemUserId,
              name: `${systemUserInfo.first_name || ''} ${systemUserInfo.last_name || ''}`.trim(),
              email: systemUserInfo.email
            },
            company_id: trainee.invitedBy || null,
            invitation_time: new Date().toISOString(),
            email_status: emailStatus
          }
        }
      );

      await this.userDaoService.insertTodaysActivityData(activityLog);
      await this.userDaoService.updateStatusEmailHistory(
        emailHistory.id,
        emailStatus
      );
    } catch (err) {
      console.error('Failed to send welcome email or log activity:', err.message);
    }
  }

  private createNewUserEntity(companyId: number, employeeId: string, email: string, password: string, firstName: string, lastName: string, userType: UserType, gender: Gender, categoryId: string, departmentId: string, roleId: number,
    companyName: string, frequency: string, businessUnit: string, division: string,joiningDate:string
  ): CompanyEntity {
    return new CompanyEntity(false, companyId, null, companyId, null, null, null, roleId, companyName, firstName, lastName, email, employeeId, null, password, null, null, null, null, null, false, null, null, null, frequency, null, null, null, null, null, null, null, null, true, userType, gender, categoryId, departmentId, businessUnit, division,null,joiningDate);
  }

  private createNewTraineeUserEntity(employeeId: string, email: string, firstName: string, lastName: string, gender: Gender, mobileNumber: string, companyName: string): TraineeUser {
    return new TraineeUser(email, firstName, mobileNumber, employeeId, gender, lastName, companyName, true);
  }

  async updateTrainingData(financialYearId: number) {
    const company = await this.userDaoService.getHeadOfficeCompanyDetails(true);
    const companyId = company?.company_id;

    const frameworkIds = (await this.externalApiCallService.getReq(
      process.env.COMPANY_SERVER_API_URL + 'getFramework',
      { companyId, type: 'ALL', user_type_code: 'company' },
      {},
    )).data.map((obj) => obj.id);

    const queryParam = {
      company_id: companyId,
      user_type_code: 'COMPANY',
      framework_ids: frameworkIds,
    };

    const getTrainingCategory = await this.externalApiCallService.getReq(
      process.env.COMPANY_SERVER_API_URL + 'getTrainingCategories',
      queryParam,
      {},
    );

    const categoryList = getTrainingCategory.data.trainingCategories;

    const financialYearDatas: { data: FinancialYear[] } = await this.externalApiCallService.getReq(
      process.env.COMPANY_SERVER_API_URL + 'getFinancialYear',
      { userId: companyId, type: 'COMPANY' },
      {},
    );

    const financialYearValue = financialYearDatas.data.find(
      (fy: FinancialYear) => fy.id == Number(financialYearId)
    )?.financial_year_value || "Not Found";

    const financialYearRange = await this.getFinancialYearRange(
      financialYearValue,
      company?.starting_month - 1
    );

    const trainingData = await this.trainingDaoService.getHeadAllTrainingListWithUserDetailsForGraph(
      Number(financialYearId),
      categoryList,
      1,
      financialYearRange.fromDate,
      financialYearRange.toDate
    );
    type FinancialYear = { id: number; financial_year_value: string };

    const financialYearData: { data: FinancialYear[] } = await this.externalApiCallService.getReq(
      process.env.COMPANY_SERVER_API_URL + 'getFinancialYear',
      { userId: companyId, type: 'COMPANY' },
      {},
    );

    // const financialYearValue = financialYearData.data.find(
    //         (fy: FinancialYear) => fy.id == createDto.financialYear
    //     )?.financial_year_value || "Not Found";

    // const financialYearRange = await this.getFinancialYearRange(
    //             financialYearValue,
    //             company?.starting_month - 1
    //         );


    const traineeList = await this.traineeDaoService.getRegisteredTraineesBasedOnCompany('Kennametal India Limited (KIL)');

    if (!traineeList.length) {
      return {
        principles: {},
        trainingPrograms: [],
      };
    }

    const principlesMap = {};
    if (trainingData.length > 0 && trainingData[0].allPrinciples) {
      trainingData[0].allPrinciples.forEach((principle, index) => {
        principlesMap[`P${index + 1}`] = principle.title;
      });
    }

    const allCategories = [
      'Board of Directors',
      'Key Managerial Personnel',
      'Employees other than BoD and KMPs',
      'Workers'
    ];

    const traineesByCategory = {};
    allCategories.forEach(cat => {
      traineesByCategory[cat] = [];
    });

    traineeList.forEach(trainee => {
      const category = this.categorizeEmployee(trainee);
      if (traineesByCategory[category]) {
        traineesByCategory[category].push(trainee);
      }
    });

    const trainingPrograms = {};
    allCategories.forEach(category => {
      trainingPrograms[category] = {
        totalEmployees: traineesByCategory[category].length,
        principleCompliance: {}
      };

      Object.keys(principlesMap).forEach(principleKey => {
        trainingPrograms[category].principleCompliance[principleKey] = {
          status: "No",
          covered: 0,
          percentage: 0,
          uniqueEmployees: new Set()
        };
      });
    });

    trainingData.forEach(training => {
      const attendants = training.attendantUsers || [];
      const trainingPrinciples = training.principles || [];

      attendants.forEach(attendant => {
        const category = this.categorizeEmployee(attendant);
        const employeeId = attendant.id || attendant.employeeId;

        if (trainingPrograms[category] && employeeId) {
          trainingPrinciples.forEach(principle => {
            const principleIndex = training.allPrinciples?.findIndex(p => p.id === principle.id);
            if (principleIndex !== -1) {
              const principleKey = `P${principleIndex + 1}`;
              const compliance = trainingPrograms[category].principleCompliance[principleKey];

              if (compliance) {
                compliance.uniqueEmployees.add(employeeId);
                compliance.status = "Yes";
              }
            }
          });
        }
      });
    });

    Object.keys(trainingPrograms).forEach(category => {
      const totalEmployees = trainingPrograms[category].totalEmployees;

      Object.keys(trainingPrograms[category].principleCompliance).forEach(principleKey => {
        const compliance = trainingPrograms[category].principleCompliance[principleKey];
        compliance.covered = compliance.uniqueEmployees.size;
        compliance.percentage = totalEmployees > 0
          ? Math.round((compliance.covered / totalEmployees) * 100 * 100) / 100
          : 0;
        delete compliance.uniqueEmployees;
      });
    });

    // Construct 2D result array with proper format
    const result: string[][] = [];
    const principleKeys = Object.keys(principlesMap); // P1 to P9

    for (const category of allCategories) {
      const row: string[] = [];
      const categoryData = trainingPrograms[category];

      const attendedTrainings = trainingData.filter(td =>
        (td.attendantUsers || []).some(att => this.categorizeEmployee(att) === category)
      );

      const allTopics = [...new Set(attendedTrainings.map(t => t['trainingTitle']).filter(Boolean))];
      const totalPrograms = attendedTrainings.length;

      row.push(totalPrograms.toString());
      row.push(allTopics.join(', ') || "N/A");

      for (const pKey of principleKeys) {
        const compliance = categoryData.principleCompliance[pKey];
        row.push(compliance?.status || "No");
      }

      const uniqueEmployeeIds = new Set();
      attendedTrainings.forEach(training => {
        (training.attendantUsers || []).forEach(att => {
          if (this.categorizeEmployee(att) === category && (att.id || att.employeeId)) {
            uniqueEmployeeIds.add(att.id || att.employeeId);
          }
        });
      });

      const avgCoverage = categoryData.totalEmployees > 0
        ? Number(((uniqueEmployeeIds.size / categoryData.totalEmployees) * 100).toFixed(2))
        : 0;


      row.push(`${avgCoverage}%`);
      result.push(row);
    }
    const questionnaireType: QuestionnaireType = 'CA' as QuestionnaireType;
    const status: QuestionStatus = 'ACCEPTED' as QuestionStatus
    const existingRecord = await this.sectorQuestionDaoModuleService.getExistingRecordTabularAnswer(34, 1, Number(financialYearId));
    if (existingRecord) {
      const historyEntity = this.createTabularHistoryEntity(existingRecord, questionnaireType);
      await this.sectorQuestionDaoModuleService.saveSectorQuestionTabularHistoryAnswer(historyEntity);
      const answerEntity = this.createTabularAnswerEntity(company.id, companyId, Number(financialYearId), questionnaireType, status, result, 34, null);
      await this.sectorQuestionDaoModuleService.updateSectorQuestionTabularAnswer(34, 1, Number(financialYearId), answerEntity);
    } else if (existingRecord === null) {
      const answerEntity = this.createTabularAnswerEntity(company.id, companyId, Number(financialYearId), questionnaireType, status, result, 34, null);
      await this.sectorQuestionDaoModuleService.saveSectorQuestionTabularAnswer(answerEntity);
    }
  }

  private getFinancialYearRange(finYear: string, startMonthIdx: number) {
    const [startY, endY] = finYear.split("-").map(y => Number(y));
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const startMonth = startMonthIdx + 1;                // convert 0..11 → 1..12
    const endMonth = ((startMonth + 11) % 12) || 12;     // 12 months later
    const tmpendMonth = ((startMonth + 11) % 12) || 12;

    // helper to pad month number
    function mm(month: number): string {
      return month.toString().padStart(2, "0");
    }

    const lastDay = new Date(endY, tmpendMonth, 0).getDate();

    console.log(`${endY}-${mm(tmpendMonth)}-${mm(lastDay)}`)


    return {
      fromDate: `${startY}-${mm(startMonth)}`, // inclusive
      toDate: `${endY}-${mm(endMonth)}`,       // exclusive
      displayName: `${months[startMonthIdx]} - ${months[endMonth - 1]}`,
      calEndMonth: `${endY}-${mm(tmpendMonth)}-${mm(lastDay)}`
    };
  }

  async updateTrainingCovarageData(financialYearId: number) {
    const company = await this.userDaoService.getHeadOfficeCompanyDetails(true);
    const companyId = company?.company_id;

    const frameworkIds = (await this.externalApiCallService.getReq(
      process.env.COMPANY_SERVER_API_URL + 'getFramework',
      { companyId, type: 'ALL', user_type_code: 'company' },
      {},
    )).data.map((obj) => obj.id);

    const queryParam = {
      company_id: companyId,
      user_type_code: 'COMPANY',
      framework_ids: frameworkIds,
    };

    const getTrainingCategory = await this.externalApiCallService.getReq(
      process.env.COMPANY_SERVER_API_URL + 'getTrainingCategories',
      queryParam,
      {},
    );

    const categoryList = getTrainingCategory.data.trainingCategories;

    type FinancialYear = { id: number; financial_year_value: string };

    const financialYearData: { data: FinancialYear[] } = await this.externalApiCallService.getReq(
      process.env.COMPANY_SERVER_API_URL + 'getFinancialYear',
      { userId: companyId, type: 'COMPANY' },
      {},
    );


    const currFinancialYearValue = financialYearData.data.find(
      (fy: FinancialYear) => fy.id == Number(financialYearId)
    )?.financial_year_value || "Not Found";

    const currFinancialYearRange = await this.getFinancialYearRange(
      currFinancialYearValue,
      company?.starting_month - 1
    );

    const lastFinancialYearValue = financialYearData.data.find(
      (fy: FinancialYear) => fy.id == Number(financialYearId)
    )?.financial_year_value || "Not Found";

    const lastFinancialYearRange = await this.getFinancialYearRange(
      lastFinancialYearValue,
      company?.starting_month - 1
    );



    const lastFinancialYear = this.getPreviousIdById(financialYearData.data, financialYearId);



    const trainingDataCurrentYear = await this.trainingDaoService.getHeadAllTrainingListWithUserDetailsForGraph(
      Number(financialYearId),
      categoryList,
      1,
      currFinancialYearRange.fromDate,
      currFinancialYearRange.toDate
    );

    const trainingDataLastYear = await this.trainingDaoService.getHeadAllTrainingListWithUserDetailsForGraph(
      Number(lastFinancialYear),
      categoryList,
      1,
      lastFinancialYearRange.fromDate,
      lastFinancialYearRange.toDate
    );



    const traineeList = await this.traineeDaoService.getRegisteredTraineesBasedOnCompany('Kennametal India Limited (KIL)');
    const currentYearAnalysis = this.getAnalysisData(traineeList, trainingDataCurrentYear);
    const lastYearAnalysis = this.getAnalysisData(traineeList, trainingDataLastYear);

    const currentTotal = {
      total: currentYearAnalysis.employees.male.total + currentYearAnalysis.employees.female.total,
      health: currentYearAnalysis.employees.male.healthSafetyCount + currentYearAnalysis.employees.female.healthSafetyCount,
      skill: currentYearAnalysis.employees.male.skillDevelopmentCount + currentYearAnalysis.employees.female.skillDevelopmentCount,
    };

    const lastTotal = {
      total: lastYearAnalysis.employees.male.total + lastYearAnalysis.employees.female.total,
      health: lastYearAnalysis.employees.male.healthSafetyCount + lastYearAnalysis.employees.female.healthSafetyCount,
      skill: lastYearAnalysis.employees.male.skillDevelopmentCount + lastYearAnalysis.employees.female.skillDevelopmentCount,
    };

    const formatPercent = (count: number, total: number): string => {
      if (!total || total === 0) return "NA";
      return ((count / total) * 100).toFixed(2) + "%";
    };

    const finalResult: string[][] = [];

    finalResult.push(["", "", "", "", "", "", "", "", "", ""]);

    finalResult.push([
      currentYearAnalysis.employees.male.total.toString(),
      currentYearAnalysis.employees.male.healthSafetyCount.toString(),
      formatPercent(currentYearAnalysis.employees.male.healthSafetyCount, currentYearAnalysis.employees.male.total),
      currentYearAnalysis.employees.male.skillDevelopmentCount.toString(),
      formatPercent(currentYearAnalysis.employees.male.skillDevelopmentCount, currentYearAnalysis.employees.male.total),
      lastYearAnalysis.employees.male.total.toString(),
      lastYearAnalysis.employees.male.healthSafetyCount.toString(),
      formatPercent(lastYearAnalysis.employees.male.healthSafetyCount, lastYearAnalysis.employees.male.total),
      lastYearAnalysis.employees.male.skillDevelopmentCount.toString(),
      formatPercent(lastYearAnalysis.employees.male.skillDevelopmentCount, lastYearAnalysis.employees.male.total),
    ]);

    finalResult.push([
      currentYearAnalysis.employees.female.total.toString(),
      currentYearAnalysis.employees.female.healthSafetyCount.toString(),
      formatPercent(currentYearAnalysis.employees.female.healthSafetyCount, currentYearAnalysis.employees.female.total),
      currentYearAnalysis.employees.female.skillDevelopmentCount.toString(),
      formatPercent(currentYearAnalysis.employees.female.skillDevelopmentCount, currentYearAnalysis.employees.female.total),
      lastYearAnalysis.employees.female.total.toString(),
      lastYearAnalysis.employees.female.healthSafetyCount.toString(),
      formatPercent(lastYearAnalysis.employees.female.healthSafetyCount, lastYearAnalysis.employees.female.total),
      lastYearAnalysis.employees.female.skillDevelopmentCount.toString(),
      formatPercent(lastYearAnalysis.employees.female.skillDevelopmentCount, lastYearAnalysis.employees.female.total),
    ]);

    finalResult.push(['0', '0', 'NA', '0', 'NA', '0', '0', 'NA', '0', 'NA']);



    finalResult.push([
      currentTotal.total.toString(),
      currentTotal.health.toString(),
      formatPercent(currentTotal.health, currentTotal.total),
      currentTotal.skill.toString(),
      formatPercent(currentTotal.skill, currentTotal.total),
      lastTotal.total.toString(),
      lastTotal.health.toString(),
      formatPercent(lastTotal.health, lastTotal.total),
      lastTotal.skill.toString(),
      formatPercent(lastTotal.skill, lastTotal.total),
    ]);

    finalResult.push(["", "", "", "", "", "", "", "", "", ""]);

    // Workers - Male
    finalResult.push([
      currentYearAnalysis.workers.male.total.toString(),
      currentYearAnalysis.workers.male.healthSafetyCount.toString(),
      formatPercent(currentYearAnalysis.workers.male.healthSafetyCount, currentYearAnalysis.workers.male.total),
      currentYearAnalysis.workers.male.skillDevelopmentCount.toString(),
      formatPercent(currentYearAnalysis.workers.male.skillDevelopmentCount, currentYearAnalysis.workers.male.total),
      lastYearAnalysis.workers.male.total.toString(),
      lastYearAnalysis.workers.male.healthSafetyCount.toString(),
      formatPercent(lastYearAnalysis.workers.male.healthSafetyCount, lastYearAnalysis.workers.male.total),
      lastYearAnalysis.workers.male.skillDevelopmentCount.toString(),
      formatPercent(lastYearAnalysis.workers.male.skillDevelopmentCount, lastYearAnalysis.workers.male.total),
    ]);

    // Workers - Female
    finalResult.push([
      currentYearAnalysis.workers.female.total.toString(),
      currentYearAnalysis.workers.female.healthSafetyCount.toString(),
      formatPercent(currentYearAnalysis.workers.female.healthSafetyCount, currentYearAnalysis.workers.female.total),
      currentYearAnalysis.workers.female.skillDevelopmentCount.toString(),
      formatPercent(currentYearAnalysis.workers.female.skillDevelopmentCount, currentYearAnalysis.workers.female.total),
      lastYearAnalysis.workers.female.total.toString(),
      lastYearAnalysis.workers.female.healthSafetyCount.toString(),
      formatPercent(lastYearAnalysis.workers.female.healthSafetyCount, lastYearAnalysis.workers.female.total),
      lastYearAnalysis.workers.female.skillDevelopmentCount.toString(),
      formatPercent(lastYearAnalysis.workers.female.skillDevelopmentCount, lastYearAnalysis.workers.female.total),
    ]);
    finalResult.push(['0', '0', 'NA', '0', 'NA', '0', '0', 'NA', '0', 'NA']);

    // Workers - Total
    const currentTotalWorkers = {
      total: currentYearAnalysis.workers.male.total + currentYearAnalysis.workers.female.total,
      health: currentYearAnalysis.workers.male.healthSafetyCount + currentYearAnalysis.workers.female.healthSafetyCount,
      skill: currentYearAnalysis.workers.male.skillDevelopmentCount + currentYearAnalysis.workers.female.skillDevelopmentCount,
    };

    const lastTotalWorkers = {
      total: lastYearAnalysis.workers.male.total + lastYearAnalysis.workers.female.total,
      health: lastYearAnalysis.workers.male.healthSafetyCount + lastYearAnalysis.workers.female.healthSafetyCount,
      skill: lastYearAnalysis.workers.male.skillDevelopmentCount + lastYearAnalysis.workers.female.skillDevelopmentCount,
    };

    finalResult.push([
      currentTotalWorkers.total.toString(),
      currentTotalWorkers.health.toString(),
      formatPercent(currentTotalWorkers.health, currentTotalWorkers.total),
      currentTotalWorkers.skill.toString(),
      formatPercent(currentTotalWorkers.skill, currentTotalWorkers.total),
      lastTotalWorkers.total.toString(),
      lastTotalWorkers.health.toString(),
      formatPercent(lastTotalWorkers.health, lastTotalWorkers.total),
      lastTotalWorkers.skill.toString(),
      formatPercent(lastTotalWorkers.skill, lastTotalWorkers.total),
    ]);
    const questionnaireType: QuestionnaireType = 'CA' as QuestionnaireType;

    const status: QuestionStatus = 'ACCEPTED' as QuestionStatus
    const existingRecord = await this.sectorQuestionDaoModuleService.getExistingRecordTabularAnswer(65, 1, Number(financialYearId));
    if (existingRecord) {
      const historyEntity = this.createTabularHistoryEntity(existingRecord, questionnaireType);
      await this.sectorQuestionDaoModuleService.saveSectorQuestionTabularHistoryAnswer(historyEntity);
      const answerEntity = this.createTabularAnswerEntity(company.id, companyId, Number(financialYearId), questionnaireType, status, finalResult, 65, null);
      await this.sectorQuestionDaoModuleService.updateSectorQuestionTabularAnswer(65, 1, Number(financialYearId), answerEntity);
    } else if (existingRecord === null) {
      const answerEntity = this.createTabularAnswerEntity(company.id, companyId, Number(financialYearId), questionnaireType, status, finalResult, 65, null);
      await this.sectorQuestionDaoModuleService.saveSectorQuestionTabularAnswer(answerEntity);
    }
  }

  async updateTrainingHumanRightData(financialYearId: number) {
    const company = await this.userDaoService.getHeadOfficeCompanyDetails(true);
    const companyId = company?.company_id;

    const frameworkIds = (await this.externalApiCallService.getReq(
      process.env.COMPANY_SERVER_API_URL + 'getFramework',
      { companyId, type: 'ALL', user_type_code: 'company' },
      {},
    )).data.map((obj) => obj.id);

    const queryParam = {
      company_id: companyId,
      user_type_code: 'COMPANY',
      framework_ids: frameworkIds,
    };

    const getTrainingCategory = await this.externalApiCallService.getReq(
      process.env.COMPANY_SERVER_API_URL + 'getTrainingCategories',
      queryParam,
      {},
    );

    const categoryList = getTrainingCategory.data.trainingCategories;

    type FinancialYear = { id: number; financial_year_value: string };

    const financialYearData: { data: FinancialYear[] } = await this.externalApiCallService.getReq(
      process.env.COMPANY_SERVER_API_URL + 'getFinancialYear',
      { userId: companyId, type: 'COMPANY' },
      {},
    );

    const lastFinancialYear = this.getPreviousIdById(financialYearData.data, financialYearId);

    const currFinancialYearValue = financialYearData.data.find(
      (fy: FinancialYear) => fy.id == Number(financialYearId)
    )?.financial_year_value || "Not Found";

    const currFinancialYearRange = await this.getFinancialYearRange(
      currFinancialYearValue,
      company?.starting_month - 1
    );

    const lastFinancialYearValue = financialYearData.data.find(
      (fy: FinancialYear) => fy.id == Number(financialYearId)
    )?.financial_year_value || "Not Found";

    const lastFinancialYearRange = await this.getFinancialYearRange(
      lastFinancialYearValue,
      company?.starting_month - 1
    );

    const trainingDataCurrentYear = await this.trainingDaoService.getHeadAllTrainingListWithUserDetailsForGraph(
      Number(financialYearId),
      categoryList,
      1,
      currFinancialYearRange.fromDate,
      currFinancialYearRange.toDate
    );

    const trainingDataLastYear = await this.trainingDaoService.getHeadAllTrainingListWithUserDetailsForGraph(
      Number(lastFinancialYear),
      categoryList,
      1,
      lastFinancialYearRange.fromDate,
      lastFinancialYearRange.toDate
    );



    const traineeList = await this.traineeDaoService.getRegisteredTraineesBasedOnCompany('Kennametal India Limited (KIL)');
    const currentYearAnalysis = this.getHumanRightAnalysisData(traineeList, trainingDataCurrentYear);
    const lastYearAnalysis = this.getHumanRightAnalysisData(traineeList, trainingDataLastYear);
    const currentTotal = {
      total: currentYearAnalysis.employees.Permanent.total + currentYearAnalysis.employees.otherThanPermanent.total,
      human: currentYearAnalysis.employees.Permanent.humanRightCount + currentYearAnalysis.employees.otherThanPermanent.humanRightCount,
    };

    const lastTotal = {
      total: lastYearAnalysis.employees.Permanent.total + lastYearAnalysis.employees.otherThanPermanent.total,
      human: lastYearAnalysis.employees.Permanent.humanRightCount + lastYearAnalysis.employees.otherThanPermanent.humanRightCount,
    };

    const formatPercent = (count: number, total: number): string => {
      if (!total || total === 0) return "NA";
      return ((count / total) * 100).toFixed(2) + "%";
    };

    const finalResult: string[][] = [];

    finalResult.push(["", "", "", "", "", "",]);
    finalResult.push([
      currentYearAnalysis.employees.Permanent.total.toString(),
      currentYearAnalysis.employees.Permanent.humanRightCount.toString(),
      formatPercent(currentYearAnalysis.employees.Permanent.humanRightCount, currentYearAnalysis.employees.Permanent.total),
      lastYearAnalysis.employees.Permanent.total.toString(),
      lastYearAnalysis.employees.Permanent.humanRightCount.toString(),
      formatPercent(lastYearAnalysis.employees.Permanent.humanRightCount, lastYearAnalysis.employees.Permanent.total),
    ]);

    finalResult.push([
      currentYearAnalysis.employees.otherThanPermanent.total.toString(),
      currentYearAnalysis.employees.otherThanPermanent.humanRightCount.toString(),
      formatPercent(currentYearAnalysis.employees.otherThanPermanent.humanRightCount, currentYearAnalysis.employees.otherThanPermanent.total),
      lastYearAnalysis.employees.otherThanPermanent.total.toString(),
      lastYearAnalysis.employees.otherThanPermanent.humanRightCount.toString(),
      formatPercent(lastYearAnalysis.employees.otherThanPermanent.humanRightCount, lastYearAnalysis.employees.otherThanPermanent.total),
    ]);


    finalResult.push([
      currentTotal.total.toString(),
      currentTotal.human.toString(),
      formatPercent(currentTotal.human, currentTotal.total),
      lastTotal.total.toString(),
      lastTotal.human.toString(),
      formatPercent(lastTotal.human, lastTotal.total),
    ]);

    finalResult.push(["", "", "", "", "", ""]);

    finalResult.push([
      currentYearAnalysis.workers.Permanent.total.toString(),
      currentYearAnalysis.workers.Permanent.humanRightCount.toString(),
      formatPercent(currentYearAnalysis.workers.Permanent.humanRightCount, currentYearAnalysis.workers.Permanent.total),
      lastYearAnalysis.workers.Permanent.total.toString(),
      lastYearAnalysis.workers.Permanent.humanRightCount.toString(),
      formatPercent(lastYearAnalysis.workers.Permanent.humanRightCount, lastYearAnalysis.workers.Permanent.total),
    ]);

    finalResult.push([
      currentYearAnalysis.workers.otherThanPermanent.total.toString(),
      currentYearAnalysis.workers.otherThanPermanent.humanRightCount.toString(),
      formatPercent(currentYearAnalysis.workers.otherThanPermanent.humanRightCount, currentYearAnalysis.workers.otherThanPermanent.total),
      lastYearAnalysis.workers.otherThanPermanent.total.toString(),
      lastYearAnalysis.workers.otherThanPermanent.humanRightCount.toString(),
      formatPercent(lastYearAnalysis.workers.otherThanPermanent.humanRightCount, lastYearAnalysis.workers.otherThanPermanent.total),
    ]);



    const currentTotalWorkers = {
      total: currentYearAnalysis.workers.Permanent.total + currentYearAnalysis.workers.otherThanPermanent.total,
      human: currentYearAnalysis.workers.Permanent.humanRightCount + currentYearAnalysis.workers.otherThanPermanent.humanRightCount,
    };

    const lastTotalWorkers = {
      total: lastYearAnalysis.workers.Permanent.total + lastYearAnalysis.workers.otherThanPermanent.total,
      human: lastYearAnalysis.workers.Permanent.humanRightCount + lastYearAnalysis.workers.otherThanPermanent.humanRightCount,
    };

    finalResult.push([
      currentTotalWorkers.total.toString(),
      currentTotalWorkers.human.toString(),
      formatPercent(currentTotalWorkers.human, currentTotalWorkers.total),
      lastTotalWorkers.total.toString(),
      lastTotalWorkers.human.toString(),
      formatPercent(lastTotalWorkers.human, lastTotalWorkers.total),
    ]);
    const questionnaireType: QuestionnaireType = 'CA' as QuestionnaireType;

    const status: QuestionStatus = 'ACCEPTED' as QuestionStatus
    const existingRecord = await this.sectorQuestionDaoModuleService.getExistingRecordTabularAnswer(85, 1, Number(financialYearId));
    if (existingRecord) {
      const historyEntity = this.createTabularHistoryEntity(existingRecord, questionnaireType);
      await this.sectorQuestionDaoModuleService.saveSectorQuestionTabularHistoryAnswer(historyEntity);
      const answerEntity = this.createTabularAnswerEntity(company.id, companyId, Number(financialYearId), questionnaireType, status, finalResult, 85, null);
      await this.sectorQuestionDaoModuleService.updateSectorQuestionTabularAnswer(85, 1, Number(financialYearId), answerEntity);
    } else if (existingRecord === null) {
      const answerEntity = this.createTabularAnswerEntity(company.id, companyId, Number(financialYearId), questionnaireType, status, finalResult, 85, null);
      await this.sectorQuestionDaoModuleService.saveSectorQuestionTabularAnswer(answerEntity);
    }

  }


  private getPreviousIdById(data: { id: number; financial_year_value: string }[], targetId: number): number | null {
    const index = data.findIndex(item => item.id === targetId);
    if (index > 0) {
      return data[index - 1].id;
    }
    return null;
  }



  private getAnalysisData(traineeList: any, trainingData: any): any {
    const analysis = {
      employees: {
        male: { total: 0, healthSafety: new Set(), skillDevelopment: new Set() },
        female: { total: 0, healthSafety: new Set(), skillDevelopment: new Set() }
      },
      workers: {
        male: { total: 0, healthSafety: new Set(), skillDevelopment: new Set() },
        female: { total: 0, healthSafety: new Set(), skillDevelopment: new Set() }
      }
    };

    if (!traineeList || !Array.isArray(traineeList)) {
      return analysis;
    }

    traineeList.forEach(trainee => {
      if (!trainee) return;

      const category = this.categorizeEmployee(trainee);
      const gender = trainee.gender?.toLowerCase() || 'unknown';

      if (category === 'Employees other than BoD and KMPs' || category === 'Board of Directors' || category === 'Key Managerial Personnel') {
        if (gender === 'male') analysis.employees.male.total++;
        else if (gender === 'female') analysis.employees.female.total++;
      } else if (category === 'Workers') {
        if (gender === 'male') analysis.workers.male.total++;
        else if (gender === 'female') analysis.workers.female.total++;
      }
    });

    const trainingCategories = {};
    if (trainingData && Array.isArray(trainingData)) {
      trainingData.forEach(training => {
        if (training.Category?.id && training.Category?.title) {
          trainingCategories[training.Category.id] = training.Category.title;
        }
      });
    }

    const healthSafetyCategoryId = Object.keys(trainingCategories).find(id =>
      trainingCategories[id]?.toLowerCase().includes('health') &&
      trainingCategories[id]?.toLowerCase().includes('safety')
    );

    const skillDevelopmentCategoryId = Object.keys(trainingCategories).find(id =>
      trainingCategories[id]?.toLowerCase().includes('skill') &&
      (trainingCategories[id]?.toLowerCase().includes('development') ||
        trainingCategories[id]?.toLowerCase().includes('upgradation'))
    );

    if (trainingData && Array.isArray(trainingData)) {
      trainingData.forEach(training => {
        if (!training) return;

        const attendants = training.attendantUsers || [];
        const trainingCategoryId = training.Category?.id?.toString();

        attendants.forEach(attendant => {
          if (!attendant) return;

          const employeeCategory = this.categorizeEmployee(attendant);
          const gender = attendant.gender?.toLowerCase() || 'unknown';
          const employeeId = attendant.id || attendant.employeeId;

          if (!employeeId) return;

          let targetCategory = null;
          if (employeeCategory === 'Employees other than BoD and KMPs' ||
            employeeCategory === 'Board of Directors' ||
            employeeCategory === 'Key Managerial Personnel') {
            targetCategory = 'employees';
          } else if (employeeCategory === 'Workers') {
            targetCategory = 'workers';
          }

          if (!targetCategory) return;

          if (trainingCategoryId === healthSafetyCategoryId) {
            if (gender === 'male') {
              analysis[targetCategory].male.healthSafety.add(employeeId);
            } else if (gender === 'female') {
              analysis[targetCategory].female.healthSafety.add(employeeId);
            }
          } else if (trainingCategoryId === skillDevelopmentCategoryId) {
            if (gender === 'male') {
              analysis[targetCategory].male.skillDevelopment.add(employeeId);
            } else if (gender === 'female') {
              analysis[targetCategory].female.skillDevelopment.add(employeeId);
            }
          }
        });
      });
    }

    ['employees', 'workers'].forEach(category => {
      ['male', 'female'].forEach(gender => {
        if (analysis[category] && analysis[category][gender]) {
          analysis[category][gender].healthSafetyCount = analysis[category][gender].healthSafety?.size || 0;
          analysis[category][gender].skillDevelopmentCount = analysis[category][gender].skillDevelopment?.size || 0;
          delete analysis[category][gender].healthSafety;
          delete analysis[category][gender].skillDevelopment;
        }
      });
    });
    return analysis
  }

  private getHumanRightAnalysisData(traineeList: any[], trainingData: any[]): any {
    const analysis = {
      employees: {
        Permanent: { total: 0, humanRight: new Set<number>(), humanRightCount: 0 },
        otherThanPermanent: { total: 0, humanRight: new Set<number>(), humanRightCount: 0 },
      },
      workers: {
        Permanent: { total: 0, humanRight: new Set<number>(), humanRightCount: 0 },
        otherThanPermanent: { total: 0, humanRight: new Set<number>(), humanRightCount: 0 },
      },
    };

    if (!Array.isArray(traineeList)) return analysis;

    // === Helper to categorize users ===
    const getGroupAndEmploymentType = (user: any): { group: 'employees' | 'workers', type: 'Permanent' | 'otherThanPermanent' } | null => {
      const category = user.categoryId?.toLowerCase();

      if (!category) return null;

      let group: 'employees' | 'workers';
      if (
        category.includes('bod') ||
        category.includes('director') ||
        category.includes('kmp') ||
        category.includes('permanent employee') ||
        category.includes('other than permanent employee')
      ) {
        group = 'employees';
      } else if (
        category.includes('permanent worker') ||
        category.includes('other than permanent worker')
      ) {
        group = 'workers';
      } else {
        group = 'employees'; // default fallback
      }

      let type: 'Permanent' | 'otherThanPermanent';
      if (category.includes('permanent')) {
        type = category.includes('other than') ? 'otherThanPermanent' : 'Permanent';
      } else {
        type = 'Permanent'; // default if unclear
      }

      return { group, type };
    };

    // === Count totals ===
    for (const trainee of traineeList) {
      const info = getGroupAndEmploymentType(trainee);
      if (!info) continue;

      analysis[info.group][info.type].total++;
    }

    // === Get Human Rights category ID ===
    let humanRightCategoryId: string | undefined;
    if (Array.isArray(trainingData)) {
      for (const training of trainingData) {
        if (training?.Category?.id === 3) {
          humanRightCategoryId = training.Category.id.toString();
          break;
        }
      }
    }

    if (!humanRightCategoryId || !Array.isArray(trainingData)) return analysis;

    // === Track Human Rights participants ===
    for (const training of trainingData) {
      if (training?.Category?.id?.toString() !== humanRightCategoryId) continue;

      const attendants = training.attendantUsers || [];
      for (const attendee of attendants) {
        const info = getGroupAndEmploymentType(attendee);
        const employeeId = attendee.id || attendee.employeeId;

        if (!info || !employeeId) continue;

        analysis[info.group][info.type].humanRight.add(employeeId);
      }
    }

    // === Convert Sets to counts ===
    ['employees', 'workers'].forEach(group => {
      ['Permanent', 'otherThanPermanent'].forEach(type => {
        const set = analysis[group][type].humanRight;
        analysis[group][type].humanRightCount = set.size;
        delete analysis[group][type].humanRight; // optional
      });
    });

    return analysis;
  }



  private categorizeEmployee(user: any): string {
    const category = user.categoryId?.toLowerCase();

    if (category?.includes('bod') || category?.includes('director')) {
      return 'Board of Directors';
    } else if (category?.includes('kmp')) {
      return 'Key Managerial Personnel';
    } else if (category?.includes('permanent employee') || category?.includes('other than permanent employee')) {
      return 'Employees other than BoD and KMPs';
    } else if (category?.includes('permanent worker') || category?.includes('other than permanent worker')) {
      return 'Workers';
    } else {
      return 'Employees other than BoD and KMPs';
    }
  }

  private createReportingAnswerEntity(systemUserId: any, financialYearId: number, questionId: number, sourceId: number, subLocationId: number, moduleId: number, fromDate: string, toDate: string,
    notApplicable: boolean, answer: string, proofDocument: string[][], proofDocumentNote: string[][], note: string[][], questionType: QuestionType, companyId: any, questionnaireType: QuestionnaireType, status: QuestionStatus): ReportingQuestionAnswerEntity {
    return new ReportingQuestionAnswerEntity(
      systemUserId, financialYearId, questionId, sourceId, subLocationId, moduleId, fromDate, toDate, notApplicable, answer, proofDocument, proofDocumentNote, status, note, questionType as QuestionType, companyId, questionnaireType
    );
  }

  private createTabularHistoryEntity(existingRecord: any, questionnaireType: QuestionnaireType): SectorQuestionTabularHistoryAnswerEntity {
    return new SectorQuestionTabularHistoryAnswerEntity(
      existingRecord.userId, existingRecord.financialYearId, existingRecord.frameworkId, existingRecord.topicId, existingRecord.kpiId, existingRecord.questionId,
      existingRecord.sourceId, existingRecord.questionType as QuestionType, existingRecord.answer, existingRecord.notApplicable, existingRecord.financialYearId, null, null, null, existingRecord.companyId,
      questionnaireType, existingRecord.updatedAt, existingRecord.status as QuestionStatus,
    );
  }
  private createTabularAnswerEntity(
    systemUserId: number,
    companyId: number,
    financialYearId: number,
    questionnaireType: QuestionnaireType,
    status: QuestionStatus,
    tmpAnswer: any,
    questionId: any,
    note: any
  ): SectorQuestionTabularAnswerEntity {
    const finalAnswer = tmpAnswer ? JSON.stringify(tmpAnswer) : '[]';
    const notApplicable = 'false';

    const performed = true; // update as needed
    const remark = '';

    return new SectorQuestionTabularAnswerEntity(
      systemUserId,
      financialYearId,
      1,
      null,
      null,
      questionId,
      1,
      'tabular_question' as QuestionType,
      finalAnswer,
      note,
      notApplicable,
      performed,
      null,
      null,
      remark,
      companyId,
      questionnaireType,
      status
    );
  }
}
