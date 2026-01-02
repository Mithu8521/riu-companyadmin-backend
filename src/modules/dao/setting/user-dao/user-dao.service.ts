import { CompanyEntity } from '@modules/setting/user/entities/user.entity';
import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Brackets, DataSource, In, IsNull, Not } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserNotificationEntity } from '@modules/setting/user/entities/user_notification.entity';
import { PasswordResetEntity } from '@modules/setting/user/entities/user_password_reset.entity';
import { PasswordHistoryEntity } from '@modules/setting/user/entities/users_password_history.entity';
import { TraineeUser } from '@modules/training/trainee/entities/external-trainee-resister.entity';
import { EmailHistoryEntity } from '@modules/setting/user/entities/email_history.entity';
import { UserActivityLog } from '@modules/setting/user/entities/user_activity_logs';
import { UserRemovalDto } from '@app/modules/setting/user/dto/remove-user.dto';
@Injectable()
export class UserDaoService {
  constructor(private dataSource: DataSource) { }

  private getRepo(entity: any) {
    return this.dataSource.getRepository(entity);
  }

  async getUser(identifier: { email?: string; employeeId?: string }) {
    const { email, employeeId } = identifier;

    const where: any = {};
    if (email) {
      where.email = email;
    } else if (employeeId) {
      where.employeeId = employeeId;
    } else {
      throw new Error("Either email or employeeId must be provided.");
    }

    return await this.dataSource.getRepository(CompanyEntity).findOne({ where });
  }

  async getTraineeUser(id: number) {
    return await this.dataSource.getRepository(TraineeUser).findOne({ where: { id }, });
  }

  async insertTodaysActivityData(userActivityLog: UserActivityLog) {
    return await this.dataSource
      .getRepository(UserActivityLog)
      .save(userActivityLog);
  }

  async allActivity(userIds: number[], options?: { limit?: number, orderBy?: string }) {
    return await this.dataSource
      .getRepository(UserActivityLog)
      .find({
        where: {
          userId: In(userIds)
        },
        order: {
          createdAt: 'DESC' // Most recent first
        },
        take: options?.limit ?? 200
      });
  }


  async allForHeadActivity(options?: { limit?: number, orderBy?: string }) {
    return await this.dataSource
      .getRepository(UserActivityLog)
      .find({
        where: {
          // No filters, returns for all users
        },
        order: {
          createdAt: 'DESC' // Most recent first
        },
        take: options?.limit ?? 200
      });
  }

  async getAllCompany(identifier: { email?: string; employeeId?: string }) {
    const { email, employeeId } = identifier;

    const where: any = {};
    if (email) {
      where.email = email;
    } else if (employeeId) {
      where.employeeId = employeeId;
    } else {
      throw new Error('Either email or employeeId must be provided.');
    }

    const companyDetails = await this.dataSource
      .getRepository(CompanyEntity)
      .find({
        where,
      });

    return companyDetails;
  }


  async getAllUsers() {
    let companyDetails = await this.dataSource
      .getRepository(CompanyEntity)
      .find({
        where: {
        },
      });
    return companyDetails;
  }

  async getCompanyDetailsBasedOnCompanyId(company_id: number) {
    let companyDetails = await this.dataSource
      .getRepository(CompanyEntity)
      .find({
        where: {
          company_id,
        },
      });
    return companyDetails;
  }
  async getHeadOfficeCompanyDetails(head_office: boolean) {
    let companyDetails = await this.dataSource
      .getRepository(CompanyEntity)
      .findOne({
        where: {
          head_office,
        },
      });
    return companyDetails;
  }

  async allAdminDetails(head_office: boolean) {
    let companyDetails = await this.dataSource
      .getRepository(CompanyEntity)
      .find({
        where: {
          head_office,
        },
      });
    return companyDetails;
  }

  async getCompanyDetailsBasedOnUserId(id: number) {
    let companyDetails = await this.dataSource
      .getRepository(CompanyEntity)
      .findOne({
        where: {
          id,
        },
      });
    return companyDetails;
  }

  async getCompanyDetailsBasedOnRoleId(role_id: number) {
    let companyDetails = await this.dataSource
      .getRepository(CompanyEntity)
      .findOne({
        where: {
          role_id,
        },
      });
    return companyDetails;
  }
  async getCompanyDetailsBasedOnParentIdNull() {
    let companyDetails = await this.dataSource
      .getRepository(CompanyEntity)
      .findOne({
        where: {
          parent_id: null,
        },
      });

    return companyDetails;
  }
  async comparePasswords(plainTextPassword: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(plainTextPassword, hashedPassword);
  }
  async inserCompanyData(companyEntity: CompanyEntity) {
    return await this.dataSource
      .getRepository(CompanyEntity)
      .save(companyEntity);
  }
  async updateSource(id: number, source_ids: string) {
    return await this.dataSource
      .getRepository(CompanyEntity)
      .update(id, { source_ids });
  }
  async removeUsersInBulk(users: UserRemovalDto[]) {
    const results = [];
    let successful = 0;
    let failed = 0;

    for (const userData of users) {
      try {
        const { employeeId, email, lastWorkingDate } = userData;

        // Determine identifier and type
        const identifier = employeeId || email;
        const identifierType = employeeId ? 'employeeId' : 'email';

        // Validate last working date format
        const lastWorkingDateObj = new Date(lastWorkingDate);
        if (isNaN(lastWorkingDateObj.getTime())) {
          results.push({
            identifier,
            identifierType,
            lastWorkingDate,
            success: false,
            message: 'Invalid last working date format. Expected: YYYY-MM-DD'
          });
          failed++;
          continue;
        }
        let user;
        
        if (employeeId) {
          user = await this.dataSource
            .getRepository(CompanyEntity)
            .createQueryBuilder("company")
            .where("TRIM(LEADING '0' FROM company.employeeId) = :empId", {
              empId: String(employeeId).replace(/^0+/, ''),
            })
            .andWhere("company.status = :status", { status: true })
            .getOne();
        } else if (email) {
          user = await this.dataSource
            .getRepository(CompanyEntity)
            .findOne({
              where: { email: email, status: true },
            });
        }

        if (!user) {
          results.push({
            identifier,
            identifierType,
            lastWorkingDate,
            success: false,
            message: `User with ${identifierType === 'employeeId' ? 'Employee ID' : 'Email'} '${identifier}' not found or already inactive`
          });
          failed++;
          continue;
        }

        // Check if user already has a last working date
        if (user.lastWorkingDate) {
          results.push({
            identifier,
            identifierType,
            lastWorkingDate,
            success: false,
            message: `User already has a last working date: ${user.lastWorkingDate}`,
            userName: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
            employeeId: user.employeeId,
            email: user.email
          });
          failed++;
          continue;
        }

        // Update user with last working date and set status to false
        await this.dataSource
          .getRepository(CompanyEntity)
          .update(user.id, {
            lastWorkingDate: lastWorkingDateObj,
            status: false
          });

        results.push({
          identifier,
          identifierType,
          lastWorkingDate,
          success: true,
          message: 'User removed successfully',
          userName: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
          employeeId: user.employeeId,
          email: user.email
        });
        successful++;

      } catch (error) {
        const identifier = userData.employeeId || userData.email;
        const identifierType = userData.employeeId ? 'employeeId' : 'email';

        console.error(`Error processing user ${identifier} (${identifierType}):`, error);
        results.push({
          identifier,
          identifierType,
          lastWorkingDate: userData.lastWorkingDate,
          success: false,
          message: `Error processing user: ${error.message}`
        });
        failed++;
      }
    }

    return {
      data: results,
      total: users.length,
      successful,
      failed
    };
  }



  async updateToken(id: number, access_token: string) {
    return await this.dataSource
      .getRepository(CompanyEntity)
      .update(id, { access_token });
  }
  async updateProfile(id: number, updateData: Partial<CompanyEntity>) {
    return await this.dataSource
      .getRepository(CompanyEntity)
      .update(id, updateData);
  }
  async updateLastName(id: number, last_name: string) {
    return await this.dataSource
      .getRepository(CompanyEntity)
      .update(id, { last_name });
  }
  async updateStatus(id: number, status: boolean) {
    return await this.dataSource
      .getRepository(CompanyEntity)
      .update(id, { status });
  }
  async updateAuditor(id: number, validate_answer: string, active_auditor_id: number) {
    return await this.dataSource
      .getRepository(CompanyEntity)
      .update(id, { validate_answer, active_auditor_id });
  }
  async updateAcceptance(role_id: number, validate_answer: string) {
    return await this.dataSource
      .getRepository(CompanyEntity)
      .update(role_id, { validate_answer });
  }
  async updatePosition(id: number, position: string) {
    return await this.dataSource
      .getRepository(CompanyEntity)
      .update(id, { position });
  }

  async updateTwoFactor(id: number, twoFaStatus: boolean) {
    return await this.dataSource
      .getRepository(CompanyEntity)
      .update(id, { twoFaStatus });
  }

  async updateOtp(id: number, otp: string, otpExpiresAt: Date) {
    return await this.dataSource
      .getRepository(CompanyEntity)
      .update(id, { otp, otpExpiresAt });
  }

  async passwordUpdate(email: string, employeeId: string, password: string) {
    const queryBuilder = this.dataSource
      .getRepository(CompanyEntity)
      .createQueryBuilder()
      .update(CompanyEntity)
      .set({ password });

    const conditions: string[] = [];
    const parameters: Record<string, any> = {};

    if (email?.trim()) {
      conditions.push('email = :email');
      parameters.email = email.trim();
    }

    if (employeeId?.trim()) {
      conditions.push('employeeId = :employeeId');
      parameters.employeeId = employeeId.trim();
    }

    if (conditions.length === 0) {
      throw new BadRequestException('Either email or employeeId must be provided.');
    }

    queryBuilder.where(conditions.join(' AND '), parameters);

    return await queryBuilder.execute();
  }

  async checkTokenFromDatabase(id: number, access_token: string) {
    let tokenExist = await this.dataSource
      .getRepository(CompanyEntity)
      .find({
        where: {
          id,
          access_token,
          status: true
        },
      });

    if (!tokenExist.length) {
      throw new HttpException(
        {
          status: 400,
          message: 'SESSION_EXPIRED',
        },
        HttpStatus.BAD_REQUEST,
      );
    } else return tokenExist;
  }

  async getUserDetails(id: number[]) {
    const users = await this.dataSource
      .getRepository(CompanyEntity)
      .find({
        where: { id: In(id) },
        select: ["id", "first_name", "last_name", "email"],
      });

    return users.map(u => ({
      id: u.id,
      first_name: u.first_name,
      last_name: u.last_name,
      email: u.email,
    }));
  }

  async insertNewNotification(userNotificationEntity: UserNotificationEntity) {
    return this.getRepo(UserNotificationEntity).save(userNotificationEntity);
  }

  async insertNewPasword(passwordResetEntity: PasswordResetEntity) {
    return this.getRepo(PasswordResetEntity).save(passwordResetEntity);
  }

  async insertNewPaswordHistory(passwordHistoryEntity: PasswordHistoryEntity) {
    return this.getRepo(PasswordHistoryEntity).save(passwordHistoryEntity);
  }

  async insertNewEmailHistory(
    email: string,
    event: string,
    status: boolean,
    payload: Record<string, any>,
    ccList: string = '',
  ) {
    const emailHistory = this.getRepo(EmailHistoryEntity).create({
      email,
      ccList,
      event,
      status,
      payload,
    });
    return this.getRepo(EmailHistoryEntity).save(emailHistory);
  }

  async updateStatusEmailHistory(id: number, status: boolean) {
    return this.getRepo(EmailHistoryEntity).update({ id }, { status });
  }

  async getAllUnsendEmail(status: boolean) {
    return this.getRepo(EmailHistoryEntity).find({
      where: { status },
    });
  }

  async updateUnsendEmailStatus(id: number, status: boolean) {
    return this.getRepo(EmailHistoryEntity)
      .update({ id }, { status });

  }


  async getLast3Password(email: string, employeeId: string) {
    return this.getRepo(PasswordHistoryEntity).find({
      where: { email, employeeId },
      order: { createdAt: 'DESC' },
      take: 3,
    });
  }

  async getUserNotification(userId: number) {
    return this.getRepo(UserNotificationEntity).find({
      where: { userId },
    });
  }

  async getUsersBySourceIds(sourceIds: number[]) {
    const qb = this.getRepo(CompanyEntity).createQueryBuilder('user');

    qb.where(
      new Brackets(qbInner => {
        sourceIds.forEach((id, index) => {
          qbInner.orWhere(`JSON_CONTAINS(user.source_ids, :id${index}, '$')`, {
            [`id${index}`]: JSON.stringify(id),
          });
        });
      })
    );

    return await qb.getMany();
  }


  async getUsers(status: boolean) {
    const query = `
      SELECT 
        u.id,
        u.source_ids,
        u.first_name,
        u.last_name,
        u.email,
        des.designation,
        u.active_auditor_id,
        sub.parent_id
      FROM 
        riu_users u
      LEFT JOIN 
        riu_sub_user_master sub 
        ON u.email = sub.email_id
      LEFT JOIN 
        riu_designation_master des 
        ON sub.designation_id = des.id
    `;
    try {
      return await this.dataSource.query(query);
    } catch (error) {
      console.error("Error executing SQL query:", error);
      throw error;
    }
  }

  async getTeamUser(userIds: number[]) {
    return this.getRepo(CompanyEntity).find({
      where: { id: In(userIds), status: true },
    });
  }
  
  async getActiveUserForGivenFinancialYear(
    financialYearEndDate: any
  ) {
    const qb = this.getRepo(CompanyEntity).createQueryBuilder('user');

    qb.where('DATE(user.joining_date) <= :financialYearEndDate', {
      financialYearEndDate,
    })
      .andWhere(
        `
      (
        (user.last_working_date IS NULL AND user.status = true)
        OR
        (user.last_working_date IS NOT NULL 
         AND user.status = false 
         AND DATE(user.last_working_date) >= :financialYearEndDate)
      )
      `,
        { financialYearEndDate }
      )
      .andWhere(
        new Brackets((qb) => {
          qb.where('user.company_id != :companyId', { companyId: 362 })
            .orWhere(
              '(user.company_id = :companyId AND user.register_company_name = :companyName)',
              {
                companyId: 362,
                companyName: 'Kennametal India Limited (KIL)',
              }
            );
        })
      );

    return await qb.getMany();
  }

}