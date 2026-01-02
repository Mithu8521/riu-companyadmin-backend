import { PermissionMasterDaoService } from '@modules/dao/setting/permission-master-dao/permission-master-dao.service';
import { RoleMasterDaoService } from '@modules/dao/setting/role-master-dao/role-master-dao.service';
import { SubUserDaoService } from '@modules/dao/setting/sub-user-dao/sub-user-dao.service';
import { UserDaoService } from '@modules/dao/setting/user-dao/user-dao.service';
import { PermissionMasterEntity } from '@modules/setting/permission/entities/permission.entity';
import { RoleMasterEntity } from '@modules/setting/permission/entities/role-master.entity';
import { UserActivityLog } from '@modules/setting/user/entities/user_activity_logs';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ExternalApiCallService } from '@utils/common/external-api-call/external-api-call.service';
import { ResponseData } from '@utils/enums/response';

@Injectable()
export class GenerateUpdateTokenService {
  constructor(
    private readonly jwtService: JwtService,
    private userDaoService: UserDaoService,
    private subUserDaoService: SubUserDaoService,
    private roleMasterDaoService: RoleMasterDaoService,
    private permissionMasterDaoService: PermissionMasterDaoService,
    private externalApiCallService: ExternalApiCallService,
  ) { }
  async generateAndUpdateToken(
    createCompanyDto: any,
    CompanyDeatls: any,
    req: any
  ): Promise<void> {
    const payload = {
      email: CompanyDeatls.email,
      employeeId: CompanyDeatls.employeeId,
      userId: CompanyDeatls.id,
      user_type_code: CompanyDeatls.user_type_code,
    };

    const options = {
      expiresIn: '12h',
    };

    const access_token = this.jwtService.sign(payload, options);

    let start = Date.now();
    await this.userDaoService.updateToken(CompanyDeatls.id, access_token);
    console.log(`updateToken took ${Date.now() - start}ms`);

    const token = access_token;
    let mainCompanyPermission;
    let transformedData;
    let hasValidPlan;
    let frameworkData: any[] = [];
    
    let queryParam = {
      companyId: CompanyDeatls.company_id,
      type: 'ALL',
      user_type_code: 'company',
    };

    const framework = await this.externalApiCallService.getReq(
      process.env.COMPANY_SERVER_API_URL + 'getFramework',
      queryParam,
      {},
    );
    console.log(`getFramework API call took ${Date.now() - start}ms`);

    frameworkData = framework?.data.map((item) => {
      return {
        view: item.title,
        permissionCode: item.title.toUpperCase().replace(/ /g, '_'),
        checked: 'true',
        id: item.id
      };
    });
    if (CompanyDeatls?.parent_id === null) {
      let queryParam = {
        company_id: CompanyDeatls.company_id,
      };

      start = Date.now();
      mainCompanyPermission = await this.externalApiCallService.getReq(
        process.env.COMPANY_SERVER_API_URL + 'getPermissionCompany',
        queryParam,
        {},
      );
      console.log(`getPermissionCompany API call took ${Date.now() - start}ms`);

      if (mainCompanyPermission?.planData?.MAPPED_FRAMEWORK) {
        let queryParam = {
          companyId: CompanyDeatls.company_id,
          type: 'ALL',
          user_type_code: 'company',
        };

        start = Date.now();
        const framework = await this.externalApiCallService.getReq(
          process.env.COMPANY_SERVER_API_URL + 'getFramework',
          queryParam,
          {},
        );
        console.log(`getFramework API call took ${Date.now() - start}ms`);

        frameworkData = framework?.data.map((item) => {
          return {
            view: item.title,
            permissionCode: item.title.toUpperCase().replace(/ /g, '_'),
            checked: 'true',
            id: item.id
          };
        });
      }

      hasValidPlan = mainCompanyPermission.hasValidPlan;
      if (hasValidPlan) {
        start = Date.now();
        const roleExit =
          await this.roleMasterDaoService.getRoleBasedOnRoleName('Admin');
        console.log(`getRoleBasedOnRoleName took ${Date.now() - start}ms`);

        if (roleExit.length === 0) {
          let roleData: RoleMasterEntity = new RoleMasterEntity(
            'Admin',
            CompanyDeatls.id,
            null,
            true,
            false,
            false,
          );

          start = Date.now();
          let insertedAdminRole =
            await this.roleMasterDaoService.insertRoleData(roleData);
          console.log(`insertRoleData took ${Date.now() - start}ms`);

          const role_id = insertedAdminRole.id;
          if (insertedAdminRole) {
            const updates = mainCompanyPermission.data.map((item) => {
              if (item.caption === 'ESG Reporting') {
                item.permissions = frameworkData;
              }

              return {
                created_by: CompanyDeatls.id,
                sequence_id: item.sequence,
                role_id: roleExit[0].id,
                newPermission: JSON.stringify(item),
              };
            });

            const start = Date.now();
            await this.permissionMasterDaoService.updateBulkPermissions(updates);
            console.log(`updateBulkPermissions took ${Date.now() - start}ms`);



          }
        } else {
          const bulkUpdateData = mainCompanyPermission.data.map((item) => {
            if (item.caption === 'ESG Reporting') {
              item.permissions = frameworkData;
            }

            return {
              created_by: Number(CompanyDeatls.id),
              sequence_id: item.sequence,
              role_id: roleExit[0].id,
              newPermission: JSON.stringify(item),
            };
          });
          const start = Date.now();
          await this.permissionMasterDaoService.updateBulkPermissions(bulkUpdateData);
          console.log(`updateBulkPermissions took ${Date.now() - start}ms`);

        }
      }
    } else {
      if (CompanyDeatls.userType === 'TRAINEE') {
        const roleId = CompanyDeatls.role_id;

        start = Date.now();
        const getPermissionDeatls =
          await this.permissionMasterDaoService.getPermissionBasedOnRoleId(
            roleId,
          );
        console.log(`getPermissionBasedOnRoleId took ${Date.now() - start}ms`);

        transformedData = getPermissionDeatls
          .map((item) => {
            const permissionObj = JSON.parse(item.permission);
            const permissions = permissionObj.permissions.map((permission) => ({
              view: permission.view,
              permissionCode: permission.permissionCode,
              checked: permission.checked,
            }));

            const checkedPermissions = permissions.filter(
              (permission) => permission.checked,
            );

            const subMenu = permissionObj.sub_menu
              .filter((subItem) => {
                if (subItem.caption === 'Internal Auditor' || subItem.caption === 'External Auditor') {
                  subItem.permissions.forEach(permission => {
                    permission.checked = true;
                  });
                }
                const checkedSubPermissions = subItem.permissions.filter(
                  (permission) => permission.checked,
                );

                return checkedSubPermissions.length > 0;
              })
              .map((subItem) => ({
                sequence: subItem.sequence,
                caption: subItem.caption,
                activeIcon: subItem.activeIcon,
                inactiveIcon: subItem.inactiveIcon,
                url: subItem.url,
                permissions: subItem.permissions.map((permission) => ({
                  view: permission.view,
                  permissionCode: permission.permissionCode,
                  checked: permission.checked,
                })),
                sub_menu: [],
              }));
            if (
              checkedPermissions.length > 0 ||
              (subMenu.length > 0 &&
                subMenu.some((subItem) => subItem.permissions.length > 0))
            ) {
              return {
                sequence: permissionObj.sequence,
                caption: permissionObj.caption,
                activeIcon: permissionObj.activeIcon,
                inactiveIcon: permissionObj.inactiveIcon,
                url: permissionObj.url,
                permissions: checkedPermissions,
                sub_menu: subMenu,
              };
            }

            return null;
          })
          .filter(Boolean);

        start = Date.now();
        const roleMaster =
          await this.roleMasterDaoService.getRoleBasedOnUserIdAndSysterCreted(
            CompanyDeatls.id,
            true,
          );
        console.log(`getRoleBasedOnUserIdAndSysterCreted took ${Date.now() - start}ms`);

        if (roleMaster) {
          for (const item of transformedData) {
            start = Date.now();
            await this.permissionMasterDaoService.updatePermission(
              Number(CompanyDeatls.id),
              item.sequence,
              roleMaster.id,
              JSON.stringify(item),
            );
            console.log(`updatePermission (trainee) took ${Date.now() - start}ms`);
          }
        } else {
          let roleData: RoleMasterEntity = new RoleMasterEntity(
            'Admin',
            CompanyDeatls.id,
            null,
            true,
            false,
            false,
          );

          start = Date.now();
          let insertedAdminRole =
            await this.roleMasterDaoService.insertRoleData(roleData);
          console.log(`insertRoleData (trainee) took ${Date.now() - start}ms`);

          for (const item of transformedData) {
            let permissionData: PermissionMasterEntity =
              new PermissionMasterEntity(
                insertedAdminRole.id,
                item.sequence,
                JSON.stringify(item),
                CompanyDeatls.id,
                false,
              );

            start = Date.now();
            await this.permissionMasterDaoService.insertPermissionData(
              permissionData,
            );
            console.log(`insertPermissionData (trainee) took ${Date.now() - start}ms`);
          }
        }
      } else {
        start = Date.now();
        const user = await this.subUserDaoService.getSubUserBasedOnCompanyId(
          CompanyDeatls.id,
        );
        console.log(`getSubUserBasedOnCompanyId took ${Date.now() - start}ms`);

        if (!user) {
          throw new HttpException(
            {
              status: 400,
              message: 'Invalid User',
            },
            HttpStatus.BAD_REQUEST,
          );
        } else {
          const roleId = user.roleId;

          start = Date.now();
          const getPermissionDeatls =
            await this.permissionMasterDaoService.getPermissionBasedOnRoleId(
              roleId,
            );
          console.log(`getPermissionBasedOnRoleId (sub-user) took ${Date.now() - start}ms`);

          transformedData = getPermissionDeatls
            .map((item) => {
              const permissionObj = JSON.parse(item.permission);
              const permissions = permissionObj.permissions.map((permission) => ({
                view: permission.view,
                permissionCode: permission.permissionCode,
                checked: permission.checked,
              }));

              const checkedPermissions = permissions.filter(
                (permission) => permission.checked,
              );

              const subMenu = permissionObj.sub_menu
                .filter((subItem) => {
                  if (subItem.caption === 'Internal Auditor' || subItem.caption === 'External Auditor') {
                    subItem.permissions.forEach(permission => {
                      permission.checked = true;
                    });
                  }
                  const checkedSubPermissions = subItem.permissions.filter(
                    (permission) => permission.checked,
                  );

                  return checkedSubPermissions.length > 0;
                })
                .map((subItem) => ({
                  sequence: subItem.sequence,
                  caption: subItem.caption,
                  activeIcon: subItem.activeIcon,
                  inactiveIcon: subItem.inactiveIcon,
                  url: subItem.url,
                  permissions: subItem.permissions.map((permission) => ({
                    view: permission.view,
                    permissionCode: permission.permissionCode,
                    checked: permission.checked,
                  })),
                  sub_menu: [],
                }));
              if (
                checkedPermissions.length > 0 ||
                (subMenu.length > 0 &&
                  subMenu.some((subItem) => subItem.permissions.length > 0))
              ) {
                return {
                  sequence: permissionObj.sequence,
                  caption: permissionObj.caption,
                  activeIcon: permissionObj.activeIcon,
                  inactiveIcon: permissionObj.inactiveIcon,
                  url: permissionObj.url,
                  permissions: checkedPermissions,
                  sub_menu: subMenu,
                };
              }

              return null;
            })
            .filter(Boolean);

          start = Date.now();
          const roleMaster =
            await this.roleMasterDaoService.getRoleBasedOnUserIdAndSysterCreted(
              CompanyDeatls.id,
              true,
            );
          console.log(`getRoleBasedOnUserIdAndSysterCreted (sub-user) took ${Date.now() - start}ms`);

          if (roleMaster) {
            for (const item of transformedData) {
              start = Date.now();
              await this.permissionMasterDaoService.updatePermission(
                Number(CompanyDeatls.id),
                item.sequence,
                roleMaster.id,
                JSON.stringify(item),
              );
              console.log(`updatePermission (sub-user) took ${Date.now() - start}ms`);
            }
          } else {
            let roleData = new RoleMasterEntity('Admin', CompanyDeatls.id, null, true, false, false);

            start = Date.now();
            const insertedAdminRole = await this.roleMasterDaoService.insertRoleData(roleData);
            console.log(`insertRoleData (sub-user) took ${Date.now() - start}ms`);

            for (const item of transformedData) {
              const permissionData = new PermissionMasterEntity(
                insertedAdminRole.id,
                item.sequence,
                JSON.stringify(item),
                CompanyDeatls.id,
                false,
              );

              start = Date.now();
              await this.permissionMasterDaoService.insertPermissionData(permissionData);
              console.log(`insertPermissionData (sub-user) took ${Date.now() - start}ms`);
            }
          }
        }
      }
    }
    CompanyDeatls.frameworkData = frameworkData;
    // Final response
    const { password, ...sanitizedCompanyDetails } = CompanyDeatls;
    // Create activity log entry for successful login
    const activityLog = UserActivityLog.createLog(
      `logged in`,
      'Authentication Successful',
      'success',
      sanitizedCompanyDetails.id,
      sanitizedCompanyDetails.id,
      {
        questionId: null,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        location: null,
        viewableChanges: null,
        metadata: {
          name: `${sanitizedCompanyDetails.first_name || ''} ${sanitizedCompanyDetails.last_name || ''}`.trim(),
          email: sanitizedCompanyDetails.email,
          employeeId: sanitizedCompanyDetails.employeeId,
          company_id: sanitizedCompanyDetails.company_id,
          is_head: CompanyDeatls?.parent_id ? 1 : 0,
          hasValidPlan: CompanyDeatls?.parent_id ? hasValidPlan : 1,
          twoFaStatus: sanitizedCompanyDetails.twoFaStatus,
          login_time: new Date().toISOString()
        }
      }
    );

    await this.userDaoService.insertTodaysActivityData(activityLog);
    throw new HttpException(
      {
        status: ResponseData.SUCCESS,
        message: 'Authentication successful',
        user: { dataValues: sanitizedCompanyDetails },
        menu: mainCompanyPermission ? mainCompanyPermission.data : transformedData,
        token,
        hasValidPlan: CompanyDeatls?.parent_id ? hasValidPlan : 1,
        is_head: CompanyDeatls?.parent_id ? 0 : 1,
        twoFaStatus: sanitizedCompanyDetails.twoFaStatus
      },
      HttpStatus.OK,
    );
  }

  async verifyToken(token: string): Promise<any> {
    let verify;
    try {
      verify = this.jwtService.verify(token);
    } catch (error) {
      throw new HttpException(
        {
          status: 400,
          message: 'SESSION_EXPIRED',
        },
        HttpStatus.BAD_REQUEST,
      );

    }

    return verify;
  }
}
