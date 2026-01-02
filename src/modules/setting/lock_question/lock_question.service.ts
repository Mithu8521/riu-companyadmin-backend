import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { LockPeriodDto } from './dto/lock-period.dto';
import { UnlockPeriodDto } from './dto/unlock-period.dto';
import { GetLockedPeriodsDto } from './dto/get-locked-periods.dto';
import { UserDaoService } from '@modules/dao/setting/user-dao/user-dao.service';
import { LockQuestionDaoService } from '@modules/dao/setting/lock_question-dao/lock_question-dao.service';

@Injectable()
export class LockQuestionService {
  constructor(
    private userDaoService: UserDaoService,
    private lockQuestionDaoService: LockQuestionDaoService
  ) {}

async lockPeriod(lockPeriodDto: LockPeriodDto, req: any) {
  try {
    const systemUserId = req.headers.userid;
    const getCompany = await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId);
    
    if (!getCompany) {
      throw new HttpException('Company not found', HttpStatus.NOT_FOUND);
    }

    const result = await this.lockQuestionDaoService.lockPeriod(
      getCompany.company_id,
      lockPeriodDto.financialYearId,
      systemUserId,
      lockPeriodDto.type,
      lockPeriodDto.reason,
      lockPeriodDto.fromDate,
      lockPeriodDto.toDate,
      lockPeriodDto.allowedUsers,
    );

    return {
      success: true,
      message: result.message,
      data: result
    };
  } catch (error) {
    throw new HttpException(
      error.message || 'Failed to lock period',
      error.status || HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

  async getLockedPeriods(query: GetLockedPeriodsDto, req: any) {
    try {
      const lockedPeriods = await this.lockQuestionDaoService.getLockedPeriods(
        query.financialYearId,
      );

      return {
        success: true,
        message: 'Locked periods retrieved successfully',
        data: lockedPeriods
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get locked periods',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }


}