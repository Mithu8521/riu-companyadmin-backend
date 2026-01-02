import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { GenerateUpdateTokenService } from '@utils/utility-function/generate-update-token/generate-update-token.service';
import { UserDaoService } from '@modules/dao/setting/user-dao/user-dao.service';

export enum API_REQUEST_TYPE {
  V1 = '/v1.0/',
  PRE_LOGIN = '/preLogin/',
  POST_LOGIN = '/postLogin/',
  AUTH = '/auth/',
}

@Injectable()
export class VerifyTokenGuard implements CanActivate {
  constructor(
    private userDaoService: UserDaoService,
    private readonly generateUpdateTokenService: GenerateUpdateTokenService,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    return this.validateToken(request);
    // return true;
  }

  /**
   * Validate Token
   * @param request
   * @returns
   */
  async validateToken(request: any): Promise<boolean> {
    if (request?.url?.includes(API_REQUEST_TYPE.POST_LOGIN)) {
      const authHeader: string = request.headers.authorization;
      const userId: number = request.headers?.userid;
      const token = authHeader.split(' ')[1];
      const decoded = await this.generateUpdateTokenService.verifyToken(token);
      if (decoded) {
        const ifExit = await this.userDaoService.checkTokenFromDatabase(
          userId,
          token,
        );
        if (ifExit.length) return true;
        else return false
      }else return false
    } else if (request?.url?.includes(API_REQUEST_TYPE.AUTH)) {
      return true;
    } else if (request?.url?.includes(API_REQUEST_TYPE.PRE_LOGIN)) {
      return true;
    }

    return false;
  }
}
