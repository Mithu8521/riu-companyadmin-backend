import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateCompanyDto } from './dto/create-user.dto';
import { ExternalApiCallService } from 'src/utils/common/external-api-call/external-api-call.service';
import { CompanyEntity } from './entities/user.entity';
import { ResponseData } from 'src/utils/enums/response';
import * as bcrypt from 'bcrypt';
import { UserDaoService } from '@modules/dao/setting/user-dao/user-dao.service';
import { SourceDaoService } from '@modules/dao/setting/source-dao/source-dao.service';
import { LocationEntity } from '../source/entities/source.entity';
import { SendMailService } from '@utils/common/send-mail/send-mail.service';
import { GenerateUpdateTokenService } from '@utils/utility-function/generate-update-token/generate-update-token.service';
import { LoginCompanyDto } from './dto/login-company.dto';
import { OrgChartDaoService } from '@modules/dao/setting/org-chart-dao/org-chart-dao.service';
import { OrgChartEntity } from '../org_chart/entities/org_chart.entity';
import { PasswordResetEntity } from './entities/user_password_reset.entity';
import { JwtService } from '@nestjs/jwt';
import { PasswordHistoryEntity } from './entities/users_password_history.entity';
import { ObjectLiteral } from 'typeorm';
import { OtpSendDto } from './dto/otp-user.dto';
import { OtpVerifyDto } from './dto/otp-verify.dto';
import { SubUserDaoService } from '@modules/dao/setting/sub-user-dao/sub-user-dao.service';
import { UserActivityLog } from './entities/user_activity_logs';
import { RemoveUsersBulkDto } from './dto/remove-user.dto';
import { RoleMasterDaoService } from '@modules/dao/setting/role-master-dao/role-master-dao.service';

const url = process.env.BASE_URL4;
const excludedDomains = process.env.excludedDomains;


interface OrgData {
  userId: string;
  orgChart?: any;
  children?: OrgData[];
}
@Injectable()
export class UserService {
  constructor(
    private externalApiCallService: ExternalApiCallService,
    private userDaoService: UserDaoService,
    private sourceDaoService: SourceDaoService,
    private sendMailService: SendMailService,
    private generateUpdateTokenService: GenerateUpdateTokenService,
    private readonly jwtService: JwtService,
    private orgChartDaoService: OrgChartDaoService,
    private subUserDaoService: SubUserDaoService,
    private roleMasterDaoService: RoleMasterDaoService,
    
  ) { }

  async resetPassword(req: any) {
    const { email, employeeId } = req.body;
    const getCompanyInfo = await this.userDaoService.getAllCompany({ email, employeeId });

    if (getCompanyInfo.length === 0) {
      throw new HttpException({ message: 'Your Email not exists' }, HttpStatus.CONFLICT,);
    }
    const payload = {
      email: getCompanyInfo[0].email,
      employeeId: getCompanyInfo[0].employeeId
    };
    const options = {
      expiresIn: '48h',
    };
    const token = this.jwtService.sign(payload, options);

    const result = await this.userDaoService.insertNewPasword(new PasswordResetEntity(token, getCompanyInfo[0].email, getCompanyInfo[0].employeeId, true));
    const userDetails = {
      email: getCompanyInfo[0].email,
      employeeId: getCompanyInfo[0].employeeId,
      name: getCompanyInfo[0].first_name + " " + getCompanyInfo[0].last_name,
    };
    const tmpUrl = `${url}#/verify/${token}`
    if (result && getCompanyInfo[0].email) {
      const payload = {
        emailData: {
          userDetails: userDetails,
          templatePath: '/../../../public/views/templates/reset-password.html',
          subject: 'Welcome to RIU',
          url: tmpUrl,
          password: token,
        },
      };
      const emailHistory = await this.userDaoService.insertNewEmailHistory(
        getCompanyInfo[0].email,
        "PASSWORD_RESET",
        false,
        payload
      );

      const emailStatus = await this.sendMailService.sendingMail(
        userDetails,
        '/../../../public/views/templates/reset-password.html',
        'Welcome to RIU',
        tmpUrl,
        token
      );

      await this.userDaoService.updateStatusEmailHistory(
        emailHistory.id,
        emailStatus
      );

      const activityLog = UserActivityLog.createLog(
        `Password reset link sent`,
        'Password Reset',
        'success',
        getCompanyInfo[0].id,
        getCompanyInfo[0].id,
        {
          questionId: null,
          ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
          userAgent: req.headers['user-agent'],
          location: null,
          viewableChanges: null,
          metadata: {
            name: `${getCompanyInfo[0].first_name || ''} ${getCompanyInfo[0].last_name || ''}`.trim(),
            email: getCompanyInfo[0].email,
            employeeId: getCompanyInfo[0].employeeId,
            token_expires_in: '48 hours',
            emailStatus: emailStatus,
            sent_time: new Date().toISOString()
          }
        }
      );
      await this.userDaoService.insertTodaysActivityData(activityLog);

      throw new HttpException({ message: 'Password Reset Link sent successfully.' }, HttpStatus.OK,);

    } else {
      if (!getCompanyInfo[0].email) {
        throw new HttpException({ message: 'Email send failed, email is missing !!' }, HttpStatus.BAD_REQUEST);
      } else {
        throw new HttpException({ message: 'Something went wrong for sending password reset link..' }, HttpStatus.CONFLICT,);
      }
    }
  }

  async usersActivity(req: any) {
    const systemUserId = req.headers.userid;
    const isHead = (await this.userDaoService.getCompanyDetailsBasedOnUserId(Number(systemUserId))).head_office;

    const userOrgChart = await this.findUserOrgChartData(systemUserId);
    let userIds
    if (userOrgChart) {
      userIds = await this.extractUserIds(userOrgChart);
    }
    // If no users are returned, include the system user ID
    if (!userIds || userIds.length === 0) {
      userIds = [Number(systemUserId)];
    }
    const getUsers = isHead ? await this.userDaoService.getAllUsers() : await this.userDaoService.getTeamUser(userIds);
    const todaysActivity = isHead ? await this.userDaoService.allForHeadActivity() : await this.userDaoService.allActivity(userIds);
    const modifiedArray = [];
    for (const obj1 of todaysActivity) {
      for (const obj2 of getUsers) {
        if (obj2.id === obj1.userId) {
          modifiedArray.push({ ...obj1, userName: obj2.first_name + " " + obj2?.last_name });
          break;
        }
      }
    }

    throw new HttpException(
      {
        status: 200,
        message: 'Data Found',
        data: modifiedArray,
      },
      HttpStatus.OK,
    );

  }

  async emailStatusCheckAndSend(req: any) {
    const getUnsendEmail = await this.userDaoService.getAllUnsendEmail(false);
    for (const info of getUnsendEmail) {
      const contentDetails = info.payload;
      const emailStatus = await this.sendMailService.sendingMail(
        contentDetails.emailData.userDetails,
        contentDetails.emailData.templatePath,
        contentDetails.emailData.subject,
        contentDetails.emailData.url,
        contentDetails.emailData.password
      );
      await this.userDaoService.updateUnsendEmailStatus(info.id, emailStatus);
    }
    throw new HttpException({ message: 'Email Status Updated' }, HttpStatus.OK,);
  }

  async changePassword(req: any) {
    const id = req.headers.userid;
    const { password } = req.body;
    const getCompanyInfo = await this.userDaoService.getCompanyDetailsBasedOnUserId(id);
    if (!getCompanyInfo) {
      throw new HttpException({ message: 'User not exists' }, HttpStatus.CONFLICT,);
    }
    const last3password = await this.userDaoService.getLast3Password(getCompanyInfo.email, getCompanyInfo.employeeId);
    const hashedPassword = bcrypt.hashSync(password, 8);
    if (last3password.length > 0) {
      if (await this.isPasswordMatch(last3password, password)) {
        throw new HttpException({ message: 'Last 3 passwords cannot be used.' }, HttpStatus.CONFLICT,);
      }
    }
    const updatepassword = await this.userDaoService.passwordUpdate(getCompanyInfo.email, getCompanyInfo.employeeId, hashedPassword);
    await this.userDaoService.insertNewPaswordHistory(new PasswordHistoryEntity(getCompanyInfo.email, getCompanyInfo.employeeId, hashedPassword));
    if (updatepassword) {
      const activityLog = UserActivityLog.createLog(
        `Password changed`,
        'Password Change',
        'success',
        getCompanyInfo.id,
        getCompanyInfo.id,
        {
          questionId: null,
          ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
          userAgent: req.headers['user-agent'],
          location: null,
          viewableChanges: null,
          metadata: {
            name: `${getCompanyInfo.first_name || ''} ${getCompanyInfo.last_name || ''}`.trim(),
            email: getCompanyInfo.email,
            employeeId: getCompanyInfo.employeeId,
            changed_time: new Date().toISOString()
          }
        }
      );

      // Save the activity log
      await this.userDaoService.insertTodaysActivityData(activityLog);
      throw new HttpException({ message: 'Your Password has been changed' }, HttpStatus.OK);
    } else {
      throw new HttpException({ status: 400, message: 'Invalid user..' }, HttpStatus.CONFLICT);
    }
  }

  async verifyPasswordResetToken(req: any) {
    const { token, password } = req.body;
    let email, employeeId;
    try {
      const verify = this.jwtService.verify(token);
      email = verify.email;
      employeeId = verify.employeeId;
    } catch (error) {
      throw new HttpException({ message: 'Reset password link expired!' }, HttpStatus.CONFLICT,);
    }
    const getCompanyInfo = await this.userDaoService.getAllCompany({ email, employeeId });
    if (!getCompanyInfo) {
      throw new HttpException({ message: 'User does not exist' }, HttpStatus.CONFLICT,);
    }
    const last3password = await this.userDaoService.getLast3Password(getCompanyInfo[0].email, getCompanyInfo[0].employeeId);
    const hashedPassword = bcrypt.hashSync(password, 8);
    if (last3password.length > 0) {
      if (await this.isPasswordMatch(last3password, password)) {
        throw new HttpException({ message: 'Last 3 passwords cannot be used.' }, HttpStatus.CONFLICT,);
      }
    }
    const updatepassword = await this.userDaoService.passwordUpdate(getCompanyInfo[0].email, getCompanyInfo[0].employeeId, hashedPassword);
    await this.userDaoService.insertNewPaswordHistory(new PasswordHistoryEntity(getCompanyInfo[0].email, getCompanyInfo[0].employeeId, hashedPassword));
    if (updatepassword) {
      const activityLog = UserActivityLog.createLog(
        `Password reset completed`,
        'Password Reset Complete',
        'success',
        getCompanyInfo[0].id,
        getCompanyInfo[0].id,
        {
          questionId: null,
          ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
          userAgent: req.headers['user-agent'],
          location: null,
          viewableChanges: null,
          metadata: {
            name: `${getCompanyInfo[0].first_name || ''} ${getCompanyInfo[0].last_name || ''}`.trim(),
            email: getCompanyInfo[0].email,
            employeeId: getCompanyInfo[0].employeeId,
            reset_time: new Date().toISOString(),
            reset_method: 'token verification'
          }
        }
      );

      // Save the activity log
      await this.userDaoService.insertTodaysActivityData(activityLog);
      throw new HttpException({ message: 'Your Password has been changed' }, HttpStatus.OK);
    } else {
      throw new HttpException({ status: 400, message: 'Link Invalid please check and try again later..' }, HttpStatus.CONFLICT);
    }
  }

  async signupCompany(createCompanyDto: CreateCompanyDto, req: any) {
    if (
      !createCompanyDto.user_type_code ||
      (!createCompanyDto.email && !createCompanyDto.employeeId) ||
      !createCompanyDto.password ||
      !createCompanyDto.business_number ||
      !createCompanyDto.company_industry ||
      !createCompanyDto.position ||
      !createCompanyDto.company_industry_id ||
      !createCompanyDto.first_name
      // !req.body.country
    ) {
      throw new HttpException(
        {
          message: 'Invalid inputs!',
        },
        HttpStatus.CONFLICT,
      );
    }
    if (createCompanyDto.user_type_code == 'company') {
      if (!createCompanyDto?.frequency) {
        throw new HttpException(
          {
            message: 'Invalid inputs!',
          },
          HttpStatus.CONFLICT,
        );
      } else {
        const frequencyArray = ['MONTHLY', 'QUATERLY', 'YEARLY', 'HALF_YEARLY'];
        if (!frequencyArray.includes(createCompanyDto?.frequency)) {
          throw new HttpException(
            {
              message: 'Invalid Frequecy',
            },
            HttpStatus.CONFLICT,
          );
        }
      }
      if (!req?.body?.source) {
        throw new HttpException(
          {
            message: 'Invalid inputs!',
          },
          HttpStatus.CONFLICT,
        );
      }
    }
    if (createCompanyDto?.email && !this.isValidEmail(createCompanyDto?.email)) {
      throw new Error('Please Provide valid email');
    }
    if (createCompanyDto?.email && !this.isCorporateEmail(createCompanyDto?.email)) {
      throw new Error('only corporate email IDs to be used!');
    }
    let register_company_name;
    if (req?.body?.request_id) {
      let isValidRequest = await this.checkInvitationValidity(
        req.body.request_id,
      );
      if (!isValidRequest) {
        throw new Error('Invalid request id.');
      }


      if (!createCompanyDto.register_company_name) {
        throw new HttpException(
          {
            message: 'Please provide company name',
          },
          HttpStatus.CONFLICT,
        );
      } else {
        register_company_name = createCompanyDto.register_company_name;
      }
    }
    const originalPassword = createCompanyDto.password;
    let hashedPassword = bcrypt.hashSync(createCompanyDto.password, 8);
    createCompanyDto.password = hashedPassword;
    (createCompanyDto.role_id = 7),
      (createCompanyDto.register_company_name = register_company_name),
      (createCompanyDto.status = false);

    const getCompanyInfo = await this.userDaoService.getAllCompany({
      email: createCompanyDto.email,
      employeeId: createCompanyDto.employeeId
    });

    if (getCompanyInfo.length > 0) {
      throw new HttpException(
        {
          message: `Already sign Up as ${getCompanyInfo[0].user_type_code}! Payement Pending`,
          data: { company_id: getCompanyInfo[0].company_id }
        },
        HttpStatus.OK,
      );
    }
    let body = {
      request_id: req?.body?.request_id,
      register_company_name: createCompanyDto.register_company_name,
      user_type_code: createCompanyDto.user_type_code,
      email: createCompanyDto.email,
      employeeId: createCompanyDto.employeeId,
      business_number: createCompanyDto.business_number,
      company_industry: createCompanyDto.company_industry,
      position: createCompanyDto.position,
      company_industry_id: createCompanyDto.company_industry_id,
      first_name: createCompanyDto.first_name,
      last_name: createCompanyDto.last_name,
      frequency: createCompanyDto.frequency,
    };

    const userData = await this.externalApiCallService.postReq(
      {},
      body,
      process.env.BASE_URL + 'auth/resisterNewCompany',
    );
    createCompanyDto.company_id = userData.company_id;

    let companyData: CompanyEntity = new CompanyEntity(true, createCompanyDto.parent_id, createCompanyDto.group_admin_id, createCompanyDto.company_id, createCompanyDto.user_type_code, null, null,
      1, createCompanyDto.register_company_name, createCompanyDto.first_name, createCompanyDto.last_name, createCompanyDto.email, createCompanyDto.employeeId, createCompanyDto.country,
      createCompanyDto.password, createCompanyDto.mobile_number, createCompanyDto.profile_picture, createCompanyDto.access_token, null, null, false, createCompanyDto.source_ids, createCompanyDto.broker_commision,
      createCompanyDto.company_industry_id, createCompanyDto.frequency, createCompanyDto.starting_month, createCompanyDto.device, createCompanyDto.business_number, createCompanyDto.company_industry, createCompanyDto.position, createCompanyDto.charge_type, createCompanyDto.charge_value, createCompanyDto.user_category, false,
      'COMPANY_USER', null, 'MALE', null, null);
    let insertedData = await this.userDaoService.inserCompanyData(companyData);
    if (insertedData) {
      let location = req.body.source;
      let created_by = insertedData.id;
      let companyName = createCompanyDto.register_company_name;


      let sourceData: LocationEntity = new LocationEntity(
        JSON.stringify(location),
        companyName,
        created_by,
        true,
        null,
        false,
      );
      let insertedSourceData =
        await this.sourceDaoService.insertLocationData(sourceData);

      const roleData = await this.roleMasterDaoService.getRoleBasedOnId(insertedData.role_id);
      const roleName = roleData?.[0]?.role_name || '';
      const { nanoid } = await import('nanoid');

      const chart = {
        id: nanoid(),
        name: `${insertedData.first_name} ${insertedData.last_name}`.trim(),
        actor: "",
        userId: insertedData.id,
        role: roleName,
        roleId: insertedData.role_id,
        audit: "",
        children: []
      };

      await this.orgChartDaoService.createOrgChart(new OrgChartEntity(JSON.stringify(chart), created_by, created_by, created_by));
      const sourceId = insertedSourceData?.id;
      const sourceIdsArray = sourceId ? [sourceId] : [];
      await this.userDaoService.updateSource(
        created_by,
        JSON.stringify(sourceIdsArray),
      );
    }
    await this.userDaoService.insertNewPaswordHistory(new PasswordHistoryEntity(createCompanyDto.email, createCompanyDto.employeeId, hashedPassword));

    if (insertedData && createCompanyDto.email) {
      const payload = {
        emailData: {
          userDetails: createCompanyDto,
          templatePath: '/../../../public/views/templates/welcomecopy.html',
          subject: 'Welcome to RIU',
          url: url,
          password: originalPassword,
        },
      };
      const emailHistory = await this.userDaoService.insertNewEmailHistory(
        createCompanyDto.email,
        "COMPANY_ADDED",
        false,
        payload
      );

      const emailStatus = await this.sendMailService.sendingMail(
        createCompanyDto,
        '/../../../public/views/templates/welcomecopy.html',
        'Welcome to RIU',
        url,
        originalPassword
      );

      await this.userDaoService.updateStatusEmailHistory(
        emailHistory.id,
        emailStatus
      );

      throw new HttpException(
        {
          message: 'Registered Successfully !!',
          company_id: userData.company_id,
        },
        HttpStatus.OK,
      );
    } else {
      if (!createCompanyDto.email) {
        throw new HttpException({ message: 'Email send failed, email is missing !!' }, HttpStatus.BAD_REQUEST);
      } else {
        throw new HttpException({ message: 'Something went wrong for sending password reset link..' }, HttpStatus.CONFLICT,);
      }
    }
  }

  async lognCompany(createCompanyDto: LoginCompanyDto, req: any) {
    if ((!createCompanyDto.email && !createCompanyDto.employeeId) || !createCompanyDto.password) {
      throw new HttpException(
        {
          status: 403,
          message: 'Invalid credentials!',
        },
        HttpStatus.FORBIDDEN,
      );
    }

    // getAllCompany
    let start = Date.now();
    let getCompanyDeatls = await this.userDaoService.getAllCompany(
      { email: createCompanyDto.email, employeeId: createCompanyDto.employeeId });
    let end = Date.now();
    console.log(`getAllCompany took ${end - start}ms`);

    if (getCompanyDeatls[0].parent_id === null && getCompanyDeatls[0].userType !== 'TRAINEE') {
      let queryParam = { email: getCompanyDeatls[0].email, employeeId: getCompanyDeatls[0].employeeId };

      // external API call
      start = Date.now();
      const mainCompany = await this.externalApiCallService.getReq(
        process.env.COMPANY_SERVER_API_URL + 'checkCompanyStatus',
        queryParam,
        {},
      );
      end = Date.now();
      console.log(`externalApiCallService.getReq took ${end - start}ms`);

      const status = mainCompany?.status[0]?.status === 1 ? true : false;

      // updateStatus
      start = Date.now();
      await this.userDaoService.updateStatus(getCompanyDeatls[0].id, status);
      end = Date.now();
      console.log(`updateStatus took ${end - start}ms`);

      getCompanyDeatls[0].status = status;
    }

    if (getCompanyDeatls.length === 0)
      throw new HttpException(
        {
          status: 403,
          notShowPopUp: true,
          message: 'Invalid credentials!',
        },
        HttpStatus.FORBIDDEN,
      );

    if (getCompanyDeatls[0].status === false)
      throw new HttpException(
        {
          status: 403,
          message: 'Your account is deactivated. You can not perform any task',
        },
        HttpStatus.FORBIDDEN,
      );

    // comparePasswords
    start = Date.now();
    const result = await this.userDaoService.comparePasswords(
      createCompanyDto.password,
      getCompanyDeatls[0].password,
    );
    end = Date.now();
    console.log(`comparePasswords took ${end - start}ms`);

    if (result) {
      let getName = getCompanyDeatls[0].first_name;
      if (getCompanyDeatls[0].last_name) {
        getName += ' ' + getCompanyDeatls[0].last_name;
      }

      // generateAndUpdateToken
      start = Date.now();
      await this.generateUpdateTokenService.generateAndUpdateToken(
        createCompanyDto,
        getCompanyDeatls[0],
        req
      );
      end = Date.now();
      console.log(`generateAndUpdateToken took ${end - start}ms`);

    } else {
      throw new HttpException(
        {
          status: 403,
          message: 'Invalid credentials!',
        },
        HttpStatus.FORBIDDEN,
      );
    }
  }

  async updateUserProfile(req: any) {
    const systemUserId = req.headers.userid;
    const data = req.body.data;

    // Track what was updated for the activity log
    const updatedFields = [];

    if ('firstName' in data) {
      await this.userDaoService.updateProfile(systemUserId, { first_name: data.firstName });
      updatedFields.push('first name');
    }

    if ('lastName' in data) {
      await this.userDaoService.updateProfile(systemUserId, { last_name: data.lastName });
      updatedFields.push('last name');
    }

    if ('position' in data) {
      await this.userDaoService.updateProfile(systemUserId, { position: data.position });
      updatedFields.push('position');
    }

    // Get updated user info for the activity log
    const userInfo = await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId);

    // Create a more detailed message showing what was changed
    const fieldsUpdatedMessage = updatedFields.length > 0
      ? updatedFields.join(', ')
      : 'fields';

    // Create activity log for profile update with detailed message
    const activityLog = UserActivityLog.createLog(
      `Profile updated - changed ${fieldsUpdatedMessage}`,
      'Profile Update',
      'success',
      systemUserId,
      systemUserId,
      {
        questionId: null,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        location: null,
        viewableChanges: {
          updated_fields: updatedFields
        },
        metadata: {
          name: `${userInfo.first_name || ''} ${userInfo.last_name || ''}`.trim(),
          email: userInfo.email,
          employeeId: userInfo.employeeId,
          updated_time: new Date().toISOString(),
          updated_fields: updatedFields
        }
      }
    );

    // Save the activity log
    await this.userDaoService.insertTodaysActivityData(activityLog);

    throw new HttpException(
      {
        status: 200,
        notShowPopUp: true,
        message: 'Updated',
      },
      HttpStatus.OK,
    );
  }

  async logout(req: any) {
    const systemUserId = req.headers.userid;
    const systemUserInfo = await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId);

    if (systemUserInfo) {
      // Create activity log for logout
      const activityLog = UserActivityLog.createLog(
        `logged out`,
        'Logout',
        'success',
        systemUserId,
        systemUserId,
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
            employeeId: systemUserInfo.employeeId,
            updated_time: new Date().toISOString()
          }
        }
      );

      await this.userDaoService.insertTodaysActivityData(activityLog);
    }
    throw new HttpException(
      {
        status: 200,
        notShowPopUp: true,
        message: 'Logged out successfully',
      },
      HttpStatus.OK,
    );
  }

  async removeUsersInBulk(removeUsersBulkDto: RemoveUsersBulkDto, req: any) {
    try {
      const results = await this.userDaoService.removeUsersInBulk(
        removeUsersBulkDto.users,
      );

      return {
        success: results.successful > 0,
        message: `Processed ${results.total} users: ${results.successful} successful, ${results.failed} failed`,
        results: results.data,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to remove users in bulk',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async uploadProfilePictureOrAttachment(req: any) {
    const systemUserId = req.headers.userid;
    const uploadImage = req.body.filename;
    const userInfo = await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId);

    if (uploadImage) {
      await this.userDaoService.updateProfile(systemUserId, { profile_picture: uploadImage });

      // Create activity log for profile picture update
      const activityLog = UserActivityLog.createLog(
        `Profile picture updated`,
        'Profile Picture Update',
        'success',
        systemUserId,
        systemUserId,
        {
          questionId: null,
          ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
          userAgent: req.headers['user-agent'],
          location: null,
          viewableChanges: {
            updated_field: 'profile_picture',
            filename: uploadImage
          },
          metadata: {
            name: `${userInfo.first_name || ''} ${userInfo.last_name || ''}`.trim(),
            email: userInfo.email,
            updated_time: new Date().toISOString(),
            filename: uploadImage
          }
        }
      );

      // Save the activity log
      await this.userDaoService.insertTodaysActivityData(activityLog);
    }

    throw new HttpException(
      {
        status: 200,
        data: uploadImage,
        message: 'Uploaded',
      },
      HttpStatus.OK,
    );
  }

  async getProfileData(req: any) {
    const systemUserId = req.headers.userid;
    const getCompanyDeatls =
      await this.userDaoService.getCompanyDetailsBasedOnUserId(
        systemUserId,
      );
    const locationIds = getCompanyDeatls.source_ids || JSON.stringify([1]);
    const getLocationDeatls =
      await this.sourceDaoService.getSourceBasedOnIds(
        JSON.parse(locationIds),
      );
    getCompanyDeatls["Location"] = getLocationDeatls;
    let queryParam = {
      company_id: req.query.userId,
    };
    const mainCompanyPermission = await this.externalApiCallService.getReq(
      process.env.COMPANY_SERVER_API_URL + 'getPermissionCompany',
      queryParam,
      {},
    );

    const hasValidPlan = mainCompanyPermission.hasValidPlan;
    throw new HttpException(
      {
        status: 200,
        message: 'User Found',
        user: getCompanyDeatls,
        currentRole: 'company',
        menu: mainCompanyPermission.data,
        hasValidPlan,
        is_head: 1,
      },
      HttpStatus.OK,
    );
  }

  async getNotificationToUser(req: any) {
    const systemUserId = req.headers.userid;
    const notification = await this.userDaoService.getUserNotification(systemUserId);

    throw new HttpException(
      {
        status: 200,
        message: 'User Found',
        data: notification,
      },
      HttpStatus.OK,
    );
  }

  async sendOtp(otpSendDto: OtpSendDto, req: any) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 5 * 60000); // 5 mins

    let user = await this.userDaoService.getUser({ email: otpSendDto.email });

    if (!user.email) {
      throw new HttpException({ message: 'Otp send failed, email is missing !!' }, HttpStatus.BAD_REQUEST);
    }

    await this.userDaoService.updateOtp(user.id, otp, otpExpiresAt);
    const payload = {
      emailData: {
        userDetails: user,
        templatePath: '/../../../public/views/templates/otp.html',
        subject: 'Welcome to RIU',
        url: otp,
        password: '',
      },
    };
    const emailHistory = await this.userDaoService.insertNewEmailHistory(
      user.email,
      'OTP_SEND',
      false,
      payload
    );
    const emailStatus = await this.sendMailService.sendingMail(
      user,
      '/../../../public/views/templates/otp.html',
      'Welcome to RIU',
      otp,
      ''
    );

    await this.userDaoService.updateStatusEmailHistory(
      emailHistory.id,
      emailStatus
    );

    const activityLog = UserActivityLog.createLog(
      `OTP sent For Login`,
      'Email Send for OTP',
      'success',
      user.id,
      user.id,
      {
        questionId: null,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        location: null,
        viewableChanges: null,
        metadata: {
          name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
          email: user.email,
          otpExpiresAt: otpExpiresAt,
          emailStatus: emailStatus,
          sent_time: new Date().toISOString()
        }
      }
    );

    // Save the activity log using userDaoService as specified
    await this.userDaoService.insertTodaysActivityData(activityLog);

    throw new HttpException(
      {
        status: 200,
        message: 'OTP sent',
      },
      HttpStatus.OK,
    );
  }

  async verifyOtp(otpVerifyDto: OtpVerifyDto, req: any) {
    const user = await this.userDaoService.getUser({ email: otpVerifyDto.email });

    if (!user || user.otp !== otpVerifyDto.otp || new Date() > user.otpExpiresAt) {
      // Log failed OTP verification attempt
      if (user) {
        const failedActivityLog = UserActivityLog.createLog(
          `OTP verification failed`,
          'OTP Verification',
          'failed',
          user.id,
          user.id,
          {
            questionId: null,
            ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
            userAgent: req.headers['user-agent'],
            location: null,
            viewableChanges: null,
            metadata: {
              name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
              email: user.email,
              attempt_time: new Date().toISOString(),
              reason: new Date() > user.otpExpiresAt ? 'OTP expired' : 'Invalid OTP'
            }
          }
        );

        await this.userDaoService.insertTodaysActivityData(failedActivityLog);
      }

      throw new HttpException(
        {
          status: 400,
          message: 'Invalid or expired OTP',
        },
        HttpStatus.BAD_GATEWAY,
      );
    }

    // Clear the OTP
    await this.userDaoService.updateOtp(user.id, null, null);

    // Log successful OTP verification
    const successActivityLog = UserActivityLog.createLog(
      `OTP verification successful`,
      'OTP Verification',
      'success',
      user.id,
      user.id,
      {
        questionId: null,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        location: null,
        viewableChanges: null,
        metadata: {
          name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
          email: user.email,
          verified_time: new Date().toISOString()
        }
      }
    );

    await this.userDaoService.insertTodaysActivityData(successActivityLog);

    throw new HttpException(
      {
        status: 200,
        message: 'OTP verified successfully',
      },
      HttpStatus.OK,
    );
  }

  async handleToggleTwoFactor(req: any) {
    const systemUserId = req.headers.userid;
    const userInfo = await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId);
    const user = await this.userDaoService.getUser({ email: req.body.email, employeeId: req.body.employeeId });
    if (!user) {
      throw new HttpException(
        {
          status: 400,
          message: 'Invalid user',
        },
        HttpStatus.BAD_GATEWAY,
      );
    }
    const twoFaStatus = req.body.status;

    await this.userDaoService.updateTwoFactor(user.id, req.body.status);
    await this.subUserDaoService.updateTwoFactor(user.id, req.body.status);
    const statusText = twoFaStatus === 1 ? 'enabled' : 'disabled';
    const activityLog = UserActivityLog.createLog(
      `Two-factor authentication ${statusText} for ${user.first_name || ''} ${user.last_name || ''}`,
      'Two-Factor Authentication',
      'success',
      userInfo.id,
      userInfo.id,
      {
        questionId: null,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        location: null,
        viewableChanges: {
          previous_status: !twoFaStatus,
          new_status: twoFaStatus
        },
        metadata: {
          name: `${userInfo.first_name || ''} ${userInfo.last_name || ''}`.trim(),
          email: user.email,
          employeeId: user.employeeId,
          updated_by: {
            id: systemUserId,
            name: `${userInfo.first_name || ''} ${userInfo.last_name || ''}`.trim(),
            email: userInfo.email,
            employeeId: userInfo.employeeId
          },
          updated_time: new Date().toISOString(),
          two_fa_status: twoFaStatus === 1 ? 'enabled' : 'disabled'
        }
      }
    );

    // Save the activity log
    await this.userDaoService.insertTodaysActivityData(activityLog);
    throw new HttpException(
      {
        status: 200,
        message: 'Update successfully',
      },
      HttpStatus.OK,
    );
  }

  async getCompanyId(userId: number): Promise<number> {

    const company = await this.getCompany(userId);

    if (!company?.company_id) {
      throw new HttpException('Company not found', HttpStatus.NOT_FOUND);
    }
    return company.company_id
  }

  async getCompany(userId: number): Promise<CompanyEntity> {
    if (!userId) {
      throw new HttpException('Unknown User', HttpStatus.BAD_REQUEST);
    }

    try {
      return await this.userDaoService.getCompanyDetailsBasedOnUserId(+userId);
    } catch (error) {
      console.error(`getCompanyId error for userId ${userId}:`, error);
      throw new HttpException('Error fetching company details', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private isValidEmail(email: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isCorporateEmail(email: string) {
    const domain = email.split('@')[1];
    return !excludedDomains.includes(domain);
  }

  private async checkInvitationValidity(request_id: string) {
    let queryParam = {
      request_id: request_id,
    };
    const invitation = await this.externalApiCallService.getReq(
      process.env.BASE_URL + 'getInvitationDetails',
      queryParam,
      {},
    );

    return invitation || false;
  }

  private async isPasswordMatch(previousPasswordData: ObjectLiteral[], password: string) {
    let matchCount = 0;
    let flag = false;
    for (const entry of previousPasswordData) {
      let result = await bcrypt.compare(password, entry.password);
      if (result) {
        flag = true;
        break;
      }
      if (++matchCount === 3) {
        break;
      }
    }
    return flag;
  }

  private async findUserOrgChartData(targetUserId: string) {
    const systemUserId = targetUserId;
    const { id: headOffice } = await this.userDaoService.getCompanyDetailsBasedOnParentIdNull();
    const getHeadOrgDetails = await this.orgChartDaoService.getOrgChartUserId(headOffice);
    const userOrgChart = await this.findUserOrgChart(JSON.parse(getHeadOrgDetails.orgChart), Number(systemUserId));
    return userOrgChart;
  }

  private async findUserOrgChart(orgData: OrgData, targetUserId: number): Promise<OrgData | null> {
    if (Number(orgData.userId) === targetUserId) return orgData;
    for (const child of orgData.children || []) {
      const result = await this.findUserOrgChart(child, targetUserId);
      if (result) return result;
    }
    return null;
  }

  private async extractUserIds(orgData: OrgData): Promise<number[]> {
    let userIds: number[] = [];

    function traverse(node: OrgData) {
      if (typeof node.userId === 'number') {
        userIds.push(node.userId);
      }
      if (node.children && node.children.length > 0) {
        node.children.forEach(child => traverse(child));
      }
    }

    traverse(orgData);
    return userIds;
  }

}
