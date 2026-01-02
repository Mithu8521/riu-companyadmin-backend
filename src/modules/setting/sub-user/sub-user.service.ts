import * as bcrypt from 'bcrypt';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateSubUserDto } from './dto/create-sub-user.dto';
import { SendMailService } from '@utils/common/send-mail/send-mail.service';
import { CommonUtilityService } from '@utils/common/common-utility/common-utility.service';
import { CompanyEntity } from '../user/entities/user.entity';
import { UserDaoService } from '@modules/dao/setting/user-dao/user-dao.service';
import { SubUserEntity } from './entities/sub-user.entity';
import { SubUserDaoService } from '@modules/dao/setting/sub-user-dao/sub-user-dao.service';
import { DesignationDaoService } from '@modules/dao/setting/designation-dao/designation-dao.service';
import { RoleMasterDaoService } from '@modules/dao/setting/role-master-dao/role-master-dao.service';
import { SourceDaoService } from '@modules/dao/setting/source-dao/source-dao.service';
import { SocketService } from '@modules/socket/socket.service';
import { UserActivityLog } from '../user/entities/user_activity_logs';
import { Gender } from '@utils/enums/Status';
import { create } from 'domain';

const url = process.env.BASE_URL4;

@Injectable()
export class SubUserService {
  constructor(
    private sendMailService: SendMailService,
    private commonUtilityService: CommonUtilityService,
    private userDaoService: UserDaoService,
    private subUserDaoService: SubUserDaoService,
    private designationDaoService: DesignationDaoService,
    private roleMasterDaoService: RoleMasterDaoService,
    private sourceDaoService: SourceDaoService,
    private readonly socketService: SocketService,
  ) { }

  async getSubUser(req: any) {
    const systemUserId = req.headers.userid;
    const getSubUserDetails = req.query.desigantionId
      ? await this.subUserDaoService.getSubUserBasedOnDesignationIds(JSON.parse(req.query.desigantionId))
      : await this.subUserDaoService.getSubUserBasedOnUserId(systemUserId);

    const parsedLocations = await this.getSubUserDetails(getSubUserDetails);

    throw new HttpException(
      { status: 200, message: parsedLocations.length > 0 ? 'Data Found' : 'No Data Found', data: parsedLocations },
      HttpStatus.OK,
    );
  }

  async getAllUser(req: any) {
    const getSubUserDetails = await this.userDaoService.getAllUsers();
    throw new HttpException(
      { status: 200, message: getSubUserDetails.length > 0 ? 'Data Found' : 'No Data Found', data: getSubUserDetails },
      HttpStatus.OK,
    );
  }


  async inviteSubUser(createSubUserDto: CreateSubUserDto, req: any) {
    const systemUserId = req.headers.userid;
    await this.insertCompanyAndSubUserData(createSubUserDto, systemUserId, req);
  }

  async reSendCredicial(req: any) {
    const systemUserId = req.headers.userid;
    const systemUserInfo = await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId);
    const userId = req.body.userId;
    const userDetail = await this.userDaoService.getCompanyDetailsBasedOnUserId(userId);
    const password = await this.commonUtilityService.generateRandomPassword(10);
    const hashedPassword = bcrypt.hashSync(password, 8);
    const userPassword = await this.userDaoService.passwordUpdate(userDetail.email, userDetail.employeeId, hashedPassword);
    const userDetails = { email: userDetail.email, employeeId: userDetail.employeeId, password: hashedPassword, first_name: userDetail.first_name, last_name: userDetail.last_name, name: userDetail.first_name + " " + userDetail.last_name };

    if (userDetail && userDetail.email) {
      const payload = {
        emailData: {
          userDetails: userDetails,
          templatePath: '/../../../public/views/templates/welcomecopy.html',
          subject: 'Welcome to RIU',
          url: url,
          password: password,
        },
      };

      const emailHistory = await this.userDaoService.insertNewEmailHistory(
        userDetail.email,
        'RESEND_CREDENTIAL',
        false,
        payload
      );
      const emailStatus = await this.sendMailService.sendingMail(
        userDetails,
        '/../../../public/views/templates/welcomecopy.html',
        'Welcome to RIU',
        url,
        password
      );

      await this.userDaoService.updateStatusEmailHistory(
        emailHistory.id,
        emailStatus
      );
      const activityLog = UserActivityLog.createLog(
        `Credentials resent to ${userDetail.first_name} ${userDetail.last_name}`,
        'Resend Credentials',
        'success',
        systemUserId,
        userId,
        {
          questionId: null,
          ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
          userAgent: req.headers['user-agent'],
          location: null,
          viewableChanges: null,
          metadata: {
            name: `${systemUserInfo.first_name || ''} ${systemUserInfo.last_name || ''}`.trim(),
            email: systemUserInfo.email,
            employeeId: systemUserInfo.employeeId,
            updated_time: new Date().toISOString(),
            target_user: {
              id: userId,
              name: `${userDetail.first_name || ''} ${userDetail.last_name || ''}`.trim(),
              email: userDetail.email,
              employeeId: userDetail.employeeId,
            },
            performed_by: {
              id: systemUserId,
              name: `${systemUserInfo.first_name || ''} ${systemUserInfo.last_name || ''}`.trim(),
              email: systemUserInfo.email,
              employeeId: systemUserInfo.employeeId,
            },
            action_time: new Date().toISOString(),
            email_status: emailStatus,
            password_reset: true
          }
        }
      );

      // Save the activity log
      await this.userDaoService.insertTodaysActivityData(activityLog);

      throw new HttpException({ message: 'Resend Successfully !!' }, HttpStatus.OK);
    } else {
      if (!userDetail.email) {
        throw new HttpException({ message: 'Email send failed, email is missing !!' }, HttpStatus.BAD_REQUEST);
      } else {
        throw new HttpException({ message: 'Something went wrong for sending password reset link..' }, HttpStatus.CONFLICT,);
      }
      
    }
  }



  async addLocationToUser(req: any) {
    const systemUserId = req.headers.userid;
    const systemUserInfo = await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId);
    const getLocationData = await this.subUserDaoService.getSubUserBasedOnId(req.body.userId);
    const userDetail = await this.userDaoService.getCompanyDetailsBasedOnUserId(getLocationData.companyId);

    let location = JSON.parse(getLocationData?.sourceId);
    let newLocation = JSON.parse(req.body?.sourceId);
    let union = Array.from(new Set([...location, ...newLocation]));
    const updatedLocationData = await this.subUserDaoService.updateSourceId(req.body.userId, JSON.stringify(union));
    const updatedLocation = await this.userDaoService.updateSource(req.body.userId, JSON.stringify(union));
    const updateSource = await this.sourceDaoService.updateDeletable(union);
    if (updatedLocationData) {
      const activityLog = UserActivityLog.createLog(
        `Locations added to ${userDetail.first_name} ${userDetail.last_name}`,
        'User Location Update',
        'success',
        systemUserId,
        getLocationData.companyId,
        {
          questionId: null,
          ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
          userAgent: req.headers['user-agent'],
          location: null,

          metadata: {
            name: `${userDetail.first_name || ''} ${userDetail.last_name || ''}`.trim(),
            email: userDetail.email,
            employeeId: userDetail.employeeId,
            updated_time: new Date().toISOString(),
            target_user: {
              id: req.body.userId,
              name: `${userDetail.first_name || ''} ${userDetail.last_name || ''}`.trim(),
              email: userDetail.email,
              employeeId: userDetail.employeeId
            },
            performed_by: {
              id: systemUserId,
              name: `${systemUserInfo.first_name || ''} ${systemUserInfo.last_name || ''}`.trim(),
              email: systemUserInfo.email,
              employeeId: systemUserInfo.employeeId,
            },

            update_time: new Date().toISOString()
          }
        }
      );

      // Save the activity log
      await this.userDaoService.insertTodaysActivityData(activityLog);

      throw new HttpException({ status: 200, message: 'Location Added Succesfully' }, HttpStatus.OK);
    } else {
      throw new HttpException({ status: 400, message: 'No Data Found' }, HttpStatus.OK);
    }
  }
  async removeLocation(req: any) {
    const systemUserId = req.headers.userid;
    const systemUserInfo = await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId);
    const userId = Number(req.body.userId);
    const locationId = req.body.locationId;

    // Get user details for the log
    const userDetail = await this.userDaoService.getCompanyDetailsBasedOnUserId(userId);

    // Get current locations
    const getLocationData = await this.subUserDaoService.getSubUserBasedOnCompanyId(userId);
    let currentLocations = JSON.parse(getLocationData?.sourceId);

    // Keep a copy of previous locations for logging
    const previousLocations = [...currentLocations];

    // Remove the specified location
    let newArray = currentLocations.filter(item => item !== locationId);

    // Update location data
    const updatedLocationData = await this.subUserDaoService.updateSourceIdBasedId(userId, JSON.stringify(newArray));
    const updatedLocation = await this.userDaoService.updateSource(userId, JSON.stringify(newArray));

    if (updatedLocationData) {
      // Create activity log for location removal
      const activityLog = UserActivityLog.createLog(
        `Location removed from ${userDetail.first_name} ${userDetail.last_name}`,
        'User Location Update',
        'success',
        systemUserId,
        userId,
        {
          questionId: null,
          ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
          userAgent: req.headers['user-agent'],
          location: null,

          metadata: {
            // Standard fields always present
            name: `${systemUserInfo.first_name || ''} ${systemUserInfo.last_name || ''}`.trim(),
            email: systemUserInfo.email,
            employeeId: systemUserInfo.employeeId,
            updated_time: new Date().toISOString(),

            // Action-specific additional data
            target_user: {
              id: userId,
              name: `${userDetail.first_name || ''} ${userDetail.last_name || ''}`.trim(),
              email: userDetail.email,
              employeeId: userDetail.employeeId,
            },
            location: {
              id: locationId,

              previous_locations: previousLocations,
              current_locations: newArray
            },
            action: 'location_removal'
          }
        }
      );

      // Save the activity log
      await this.userDaoService.insertTodaysActivityData(activityLog);

      throw new HttpException({ status: 200, message: 'Location Removed Succesfully' }, HttpStatus.OK);
    } else {
      throw new HttpException({ status: 400, message: 'No Data Found' }, HttpStatus.OK);
    }
  }

  async actionOnSubUser(req: any) {
    const systemUserId = req.headers.userid;
    const systemUserInfo = await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId);
    const { userId, status } = req.body;
    
    // Get user details for the log
    const userDetail = await this.userDaoService.getCompanyDetailsBasedOnUserId(userId);
    
    // Convert status to a readable format
    const statusText = status ? 'activated' : 'deactivated';
    
    // Update user status
    const updatedLocationData = await this.subUserDaoService.updateStatus(userId, status);
    const updatedLocation = await this.userDaoService.updateStatus(userId, status);
    
    if (updatedLocationData) {
      // Create activity log for user status change
      const activityLog = UserActivityLog.createLog(
        `User ${statusText} - ${userDetail.first_name} ${userDetail.last_name}`,
        'User Status Update',
        'success',
        systemUserId,
        userId,
        {
          questionId: null,
          ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
          userAgent: req.headers['user-agent'],
          location: null,
          metadata: {
            // Standard fields always present
            name: `${systemUserInfo.first_name || ''} ${systemUserInfo.last_name || ''}`.trim(),
            email: systemUserInfo.email,
            employeeId: systemUserInfo.employeeId,
            updated_time: new Date().toISOString(),
            
            // Action-specific additional data
            target_user: {
              id: userId,
              name: `${userDetail.first_name || ''} ${userDetail.last_name || ''}`.trim(),
              email: userDetail.email,
              employeeId: userDetail.employeeId,
            },
            status_change: {
              current: status,
              current_text: statusText
            },
            action: 'user_status_update'
          }
        }
      );
      
      // Save the activity log
      await this.userDaoService.insertTodaysActivityData(activityLog);
      
      throw new HttpException({ status: 200, message: 'Upadated Succesfully' }, HttpStatus.OK);
    } else {
      throw new HttpException({ status: 400, message: 'No Data Found' }, HttpStatus.OK);
    }
  }


  async getSubUserBasedOnRoleId(req: any) {
    const getSubUserDetails = await this.subUserDaoService.getSubUserBasedOnRoleId((req.query.roleId));
    const parsedLocations = await this.getSubUserDetails(getSubUserDetails);

    if (parsedLocations.length > 0) {
      throw new HttpException({ status: 200, message: 'Data Found', data: parsedLocations }, HttpStatus.OK);
    } else {
      throw new HttpException({ status: 400, message: 'No Data Found' }, HttpStatus.OK);
    }
  }

  async getSubUserBasedOnRoleIds(req: any) {
    const getSubUserDetails = await this.subUserDaoService.getSubUserBasedOnRoleIds(JSON.parse(req.query.roleIds));
    const parsedLocations = await this.getSubUserDetails(getSubUserDetails);

    if (parsedLocations.length > 0) {
      throw new HttpException({ status: 200, message: 'Data Found', data: parsedLocations }, HttpStatus.OK);
    } else {
      throw new HttpException({ status: 400, message: 'No Data Found' }, HttpStatus.OK);
    }
  }

  async getSubUserBasedOnDesiganationId(req: any) {
    const getSubUserDetails = await this.subUserDaoService.getSubUserBasedOnDesignationId(req.query.designationId);
    const parsedLocations = await this.getSubUserDetails(getSubUserDetails);

    if (parsedLocations.length > 0) {
      throw new HttpException({ status: 200, message: 'Data Found', data: parsedLocations }, HttpStatus.OK);
    } else {
      throw new HttpException({ status: 400, message: 'No Data Found' }, HttpStatus.OK);
    }
  }

  private async getSubUserDetails(getSubUserDetails: any[]) {
    const parsedLocations = [];
    for (const item of getSubUserDetails) {
      const getDesignation = await this.designationDaoService.getDesignationBasedOnId(item.designationId);
      const getuser = await this.userDaoService.getCompanyDetailsBasedOnUserId(item.companyId);
      const getRole = await this.roleMasterDaoService.getRoleBasedOnId(item.roleId);
      const locationArray = await Promise.all(JSON.parse(item.sourceId).map(async (sourceId) => {
        const getSourceDetails = await this.sourceDaoService.getSourceBasedOnId(Number(sourceId));
        return getSourceDetails && getSourceDetails.location && getSourceDetails?.unitCode
          ? { location: JSON.parse(getSourceDetails.location), unitCode: getSourceDetails?.unitCode, sourceId: getSourceDetails.id, headOffice: getSourceDetails?.head_Office }
          : null;
      }));
      const haveHeadOffice = locationArray.some(location => location && location.headOffice);

      if(getuser){
      const userData = {
        emailId: item.emailId,
        employeeId: item.employeeId,
        firstName: item.firstName,
        lastName: item.lastName,
        mobileNumber: item.mobileNumber,
        designation: getDesignation?.designation,
        role: getRole[0]?.role_name,
        auditor: getRole[0]?.onlyauditor,
        location: locationArray.filter(Boolean),
        userId: item.companyId,
        roleId: item.roleId,
        joiningDate:getuser.joiningDate,
        haveHeadOffice: haveHeadOffice,
        status: item.status,
        twoFaStatus: item.twoFaStatus
      };
      parsedLocations.push(userData);
      }
    }
    return parsedLocations;
  }


  private async insertCompanyAndSubUserData(createSubUserDto: CreateSubUserDto, systemUserId: number, req: any) {
    const password = await this.commonUtilityService.generateRandomPassword(10);
    const hashedPassword = bcrypt.hashSync(password, 8);
    createSubUserDto.gender
    const getCompanyInfo = await this.userDaoService.getAllCompany(
      {
        email: createSubUserDto.emailId,
        employeeId: createSubUserDto.employeeId
      }
    );
    if (req.body.type === "TRAINER") {
      if (getCompanyInfo.length > 0) {
        throw new HttpException({ message: 'Already registered for this email or employeeId!', userId: getCompanyInfo[0].id, notShowPopUp: true, }, HttpStatus.OK);
      }
    }
    if (getCompanyInfo.length > 0) {
      throw new HttpException({ message: 'Already registered for this email or employeeId!', userId: getCompanyInfo[0].id }, HttpStatus.CONFLICT);
    }

    const getCompany = await this.userDaoService.getCompanyDetailsBasedOnCompanyId(createSubUserDto.invitedBy);
    const getDesignation = (await this.designationDaoService.getDesignationBasedOnId(createSubUserDto.designationId))?.designation;

    if (!getDesignation) {
      throw new HttpException('Designation not found', HttpStatus.BAD_REQUEST);
    }

    const companyData = new CompanyEntity(
      false, createSubUserDto.invitedBy, null, createSubUserDto.invitedBy, null, null, null, createSubUserDto.roleId,
      createSubUserDto.companyName, createSubUserDto.firstName, createSubUserDto.lastName, createSubUserDto.emailId, createSubUserDto.employeeId, null, hashedPassword,
      createSubUserDto.mobileNumber, null, null, null, null, false, createSubUserDto.sourceId, null, null, getCompany[0].frequency,
      null, null, null, null, getDesignation, null, null, null, true, 'COMPANY_USER', createSubUserDto.gender as Gender, createSubUserDto.categoryId, null, createSubUserDto.businessUnit, createSubUserDto.division,null,createSubUserDto.joiningDate
    );

    const insertedCompanyDetails = await this.userDaoService.inserCompanyData(companyData);
    const getRoleDeatls = await this.roleMasterDaoService.getRoleBasedOnId(createSubUserDto.roleId);
    const updatedUser = JSON.parse(getRoleDeatls[0].assigned_to);
    updatedUser.push(insertedCompanyDetails.id);
    await this.roleMasterDaoService.updateUsers(createSubUserDto.roleId, JSON.stringify(updatedUser));

    const subUserData = new SubUserEntity(
      createSubUserDto.emailId, createSubUserDto.employeeId, createSubUserDto.firstName, createSubUserDto.lastName, createSubUserDto.mobileNumber,
      systemUserId, insertedCompanyDetails.id, systemUserId, createSubUserDto.designationId,
      createSubUserDto.sourceId, createSubUserDto.roleId, false, true,
    );

    const insertedData = await this.subUserDaoService.inserSubUserData(subUserData);
    const userDetails = { 
      email: createSubUserDto.emailId, 
      employeeId: createSubUserDto.employeeId,
      password: hashedPassword, 
      first_name: createSubUserDto.firstName, 
      last_name: createSubUserDto.lastName, 
      name: createSubUserDto.firstName + " " + createSubUserDto.lastName 
    };

    if (insertedData && createSubUserDto.emailId) {
      const payload = {
        emailData: {
          userDetails: userDetails,
          templatePath: '/../../../public/views/templates/welcomecopy.html',
          subject: 'Welcome to RIU',
          url: url,
          password: password,
        },
      };
      const emailHistory = await this.userDaoService.insertNewEmailHistory(
        userDetails.email,
        req.body.type === "TRAINER" ? 'TRAINER_ADDED' : 'USER_ADDED',
        false,
        payload
      );

      const emailStatus = await this.sendMailService.sendingMail(
        userDetails,
        '/../../../public/views/templates/welcomecopy.html',
        'Welcome to RIU',
        url,
        password
      );

      await this.userDaoService.updateStatusEmailHistory(
        emailHistory.id,
        emailStatus
      );


      const userType = req.body.type === "TRAINER" ? "Trainer" : "User";
      const systemUserId = req.headers.userid;
      const systemUserInfo = await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId);
      const activityLog = UserActivityLog.createLog(
        `${userType} invited - ${createSubUserDto.firstName} ${createSubUserDto.lastName}`,
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
            employeeId: systemUserInfo.employeeId,

            invited_user: {
              id: insertedCompanyDetails.id,
              name: `${createSubUserDto.firstName} ${createSubUserDto.lastName}`,
              email: createSubUserDto.emailId,
              employeeId: createSubUserDto.employeeId,
              mobile: createSubUserDto.mobileNumber,
              designation: getDesignation,
              role_id: createSubUserDto.roleId,
              role_name: getRoleDeatls[0].role_name
            },
            invited_by: {
              id: systemUserId,
              name: `${systemUserInfo.first_name || ''} ${systemUserInfo.last_name || ''}`.trim(),
              email: systemUserInfo.email,
              employeeId: systemUserInfo.employeeId,
            },
            company_id: createSubUserDto.invitedBy,
            invitation_time: new Date().toISOString(),
            email_status: emailStatus
          }
        }
      );

      // Save the activity log
      await this.userDaoService.insertTodaysActivityData(activityLog);

      if (req.body.type === "TRAINER") {
        throw new HttpException({ message: 'Invite Successfully !!', userId: insertedCompanyDetails.id, notShowPopUp: true, }, HttpStatus.OK);
      }
      throw new HttpException({ message: 'Invite Successfully !!', userId: insertedCompanyDetails.id }, HttpStatus.OK);
    } else {
      throw new HttpException({ message: "Invite successfully, but we couldn't send the email because no address was provided.", userId: insertedCompanyDetails.id }, HttpStatus.OK);
    }
  }

}
