import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateRoleMasterDto } from './dto/create-role-master.dto';
import { RoleMasterEntity } from './entities/role-master.entity';
import { RoleMasterDaoService } from '@modules/dao/setting/role-master-dao/role-master-dao.service';
import { PermissionMasterDaoService } from '@modules/dao/setting/permission-master-dao/permission-master-dao.service';
import { PermissionMasterEntity } from './entities/permission.entity';
import { UpdateRoleMasterDto } from './dto/update-role-master.dto';
import { DeleteRoleMasterDto } from './dto/delete-role-master.dto';
import { UserDaoService } from '@modules/dao/setting/user-dao/user-dao.service';
import { UserActivityLog } from '../user/entities/user_activity_logs';

@Injectable()
export class PermissionService {
  constructor(
    private roleMasterDaoService: RoleMasterDaoService,
    private userDaoService: UserDaoService,
    private permissionMasterDaoService: PermissionMasterDaoService,
  ) { }

  async createRoleMaster(createRoleMasterDto: CreateRoleMasterDto, req: any) {
    const systemUserId = req.headers.userid;
    const systemUserInfo = await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId);

    let roleData: RoleMasterEntity = new RoleMasterEntity(
      createRoleMasterDto.roleName,
      systemUserId,
      JSON.stringify([]),
      false,
      false,
      true,
    );
    let insertedData = await this.roleMasterDaoService.insertRoleData(roleData);
    if (insertedData) {
      const roleMaster =
        await this.roleMasterDaoService.getRoleBasedOnUserIdAndSysterCreted(
          insertedData.created_by,
          true,
        );
      const getPermissionDeatls =
        await this.permissionMasterDaoService.getPermissionBasedOnRoleId(
          roleMaster.id,
        );
      const transformedData = getPermissionDeatls.map((item) => {
        const permissionObj = JSON.parse(item.permission);
        const permissions = permissionObj.permissions.map((permission) => ({
          view: permission.view,
          permissionCode: permission.permissionCode,
          checked: false,
        }));

        const subMenu = permissionObj.sub_menu.map((subItem) => ({
          sequence: subItem.sequence,
          caption: subItem.caption,
          activeIcon: subItem.activeIcon,
          inactiveIcon: subItem.inactiveIcon,
          url: subItem.url,
          permissions: subItem.permissions.map((permission) => ({
            view: permission.view,
            permissionCode: permission.permissionCode,
            checked: false,
          })),
          sub_menu: [],
        }));

        return {
          sequence: permissionObj.sequence,
          caption: permissionObj.caption,
          activeIcon: permissionObj.activeIcon,
          inactiveIcon: permissionObj.inactiveIcon,
          url: permissionObj.url,
          permissions,
          sub_menu: subMenu,
        };
      });

      for (const item of transformedData) {
        let permissionData: PermissionMasterEntity = new PermissionMasterEntity(
          insertedData.id,
          item.sequence,
          JSON.stringify(item),
          systemUserId,
          false,
        );

        await this.permissionMasterDaoService.insertPermissionData(
          permissionData,
        );
      }
      const activityLog = UserActivityLog.createLog(
        `Role created - ${createRoleMasterDto.roleName}`,
        'Role Creation',
        'success',
        systemUserId,
        insertedData.id,
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
      throw new HttpException(
        {
          status: 200,
          message: 'Created successfully',
        },
        HttpStatus.OK,
      );
    }
  }

  async updateAcceptence(req: any) {
    const { roleId, validatorAnswer } = req.query.roleId;

    const getCompany = await this.userDaoService.updateAcceptance(roleId, validatorAnswer);
    if (getCompany) {
      throw new HttpException(
        {
          status: 200,
          message: 'Data Found',
          data: getCompany,
        },
        HttpStatus.OK,
      );
    }
  }

  async getRoleMasterDataBasedOnId(req: any) {
    const roleId = req.query.roleId;
    const getRoleDeatls = await this.roleMasterDaoService.getRoleBasedOnId(
      roleId,
    );
    if (getRoleDeatls) {
      throw new HttpException(
        {
          status: 200,
          message: 'Data Found',
          data: getRoleDeatls,
        },
        HttpStatus.OK,
      );
    }
  }
  async getRoleMasterData(req: any) {
    const systemUserId = req.headers.userid;
    const getRoleDeatls = await this.roleMasterDaoService.getRoleBasedOnUserId(
      systemUserId,
    );
    if (getRoleDeatls) {
      throw new HttpException(
        {
          status: 200,
          message: 'Data Found',
          data: getRoleDeatls,
        },
        HttpStatus.OK,
      );
    }
  }
  
  async updateRoleMaster(updateRoleMasterDto: UpdateRoleMasterDto, req: any) {
    const systemUserId = req.headers.userid;
    const systemUserInfo = await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId);
    const { id, roleName } = updateRoleMasterDto;
    
    // Get current role data for the log
    const currentRole = await this.roleMasterDaoService.getRoleBasedOnId(id);
    const previousRoleName = currentRole[0]?.role_name || 'Unknown role';
    
    // Update role master data
    const updatedData = await this.roleMasterDaoService.updateRoleMasterData(id, roleName);
  
    if (updatedData) {
      // Create activity log for role update
      const activityLog = UserActivityLog.createLog(
        `Role updated - ${previousRoleName} to ${roleName}`,
        'Role Update',
        'success',
        systemUserId,
        id,
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
  
      throw new HttpException(
        {
          status: 200,
          message: 'Updated successfully',
        },
        HttpStatus.OK,
      );
    }
  }

  async deleteRoleMaster(deleteRoleMasterDto: DeleteRoleMasterDto, req: any) {
    const systemUserId = req.headers.userid;
    const systemUserInfo = await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId);
    const { id } = deleteRoleMasterDto;
    
    // Get role details before deletion
    const roleData = await this.roleMasterDaoService.getRoleBasedOnId(id);
    const roleName = roleData[0]?.role_name || 'Unknown role';
    
    // Delete the role
    const deletedData = await this.roleMasterDaoService.deleteRoleMasterData(id);
  
    if (deletedData) {
      // Create activity log for role deletion
      const activityLog = UserActivityLog.createLog(
        `Role deleted - ${roleName}`,
        'Role Deletion',
        'success',
        systemUserId,
        id,
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
          message: 'Role not found',
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  async updatePermissionToRole(req: any) {
    const systemUserId = req.headers.userid;
    const systemUserInfo = await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId);
    
    // Validate request body
    if (!req.body.updatedPermissions) {
      throw new HttpException(
        {
          status: 400,
          message: 'Permission Required',
        },
        HttpStatus.CONFLICT,
      );
    }
    
    if (!req.body.roleId) {
      throw new HttpException(
        {
          status: 400,
          message: 'Role ID Required',
        },
        HttpStatus.CONFLICT,
      );
    }
    
    const permissions = req.body.updatedPermissions;
    const roleId = req.body.roleId;
    
    // Get role details for the log
    const roleData = await this.roleMasterDaoService.getRoleBasedOnId(roleId);
    const roleName = roleData[0]?.role_name || 'Unknown role';
    
    // Count how many permissions were updated
    let updatedCount = 0;
    let insertedCount = 0;
    
    // Process each permission
    for (const permission of permissions) {
      const permissionData =
        await this.permissionMasterDaoService.getPermissionBasedOnRoleIdAndSequenceId(
          roleId,
          permission.permission.sequence,
          Number(systemUserId),
        );
        
      if (permissionData) {
        if (permission.permission.caption === "Audit") {
          const submenu = permission.permission.sub_menu;
  
          const updateOnlyAuditor = async (permissionsArray) => {
            const hasCheckedTrue = permissionsArray.some(obj => obj.checked === true);
            if (hasCheckedTrue) {
              await this.roleMasterDaoService.updateOnlyAuditor(roleId, true);
            }
          };
  
          const internalAuditorObject = submenu.find(obj => obj.caption === 'Internal Auditor');
          if (internalAuditorObject) {
            const permissionsArray = internalAuditorObject.permissions;
            await updateOnlyAuditor(permissionsArray);
          } else {
            const externalAuditorObject = submenu.find(obj => obj.caption === 'External Auditor');
            if (externalAuditorObject) {
              const permissionsArray = externalAuditorObject.permissions;
              await updateOnlyAuditor(permissionsArray);
            }
          }
        }
  
        await this.permissionMasterDaoService.updatePermission(
          Number(systemUserId),
          permission.permission.sequence,
          roleId,
          JSON.stringify(permission.permission),
        );
        
        updatedCount++;
      } else {
        let permissionData: PermissionMasterEntity = new PermissionMasterEntity(
          roleId,
          permission.permission.sequence,
          JSON.stringify(permission.permission),
          Number(systemUserId),
          false,
        );
        await this.permissionMasterDaoService.insertPermissionData(
          permissionData,
        );
        
        insertedCount++;
      }
    }
    
    // Create summary of changes for logging
    const changesSummary = [];
    if (updatedCount > 0) changesSummary.push(`${updatedCount} updated`);
    if (insertedCount > 0) changesSummary.push(`${insertedCount} added`);
    const changesText = changesSummary.join(', ');
    
    // Create activity log for permission updates
    const activityLog = UserActivityLog.createLog(
      `Permissions updated for role ${roleName} (${changesText})`,
      'Role Permissions Update',
      'success',
      systemUserId,
      roleId,
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
  
    throw new HttpException(
      {
        status: 200,
        message: 'Successfully Updated',
      },
      HttpStatus.OK,
    );
  }

  async getPermissionMasterData(req: any) {
    const getPermissionDeatls = await this.permissionMasterDaoService.getPermissionBasedOnRoleId( req.query.role_id );

    const getCompany = await this.userDaoService.getCompanyDetailsBasedOnRoleId(req.query.role_id);
    const answerAccepted = getCompany?.validate_answer;
    const transformedData = getPermissionDeatls.map((item) => {
      const permissionObj = JSON.parse(item.permission);
      const permissions = permissionObj.permissions.map((permission) => ({
        view: permission.view,
        permissionCode: permission.permissionCode,
        checked: permission.checked,
      }));

      const subMenu = permissionObj.sub_menu.map((subItem) => ({
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

      return {
        sequence: permissionObj.sequence,
        caption: permissionObj.caption,
        activeIcon: permissionObj.activeIcon,
        inactiveIcon: permissionObj.inactiveIcon,
        url: permissionObj.url,
        permissions,
        sub_menu: subMenu,
      };
    });

    if (getPermissionDeatls) {
      throw new HttpException(
        {
          status: 200,
          message: 'Data Found',
          data: transformedData,
          answerAccepted: answerAccepted

        },
        HttpStatus.OK,
      );
    }
  }
}
