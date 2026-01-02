import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { DesignationDaoService } from '@modules/dao/setting/designation-dao/designation-dao.service';
import { DesignationEntity } from './entities/designation.entity';
import { CreateDesignationDto } from './dto/create-designation.dto';
import { UpdateDesignationDto } from './dto/update-designation.dto';
import { DeleteDesignationDto } from './dto/delete-desigantion.dto';
import { UserDaoService } from '@modules/dao/setting/user-dao/user-dao.service';
import { UserActivityLog } from '../user/entities/user_activity_logs';

@Injectable()
export class DesignationService {
  constructor(private designationDaoService: DesignationDaoService, private userDaoService:UserDaoService) {}

  async createDesignation(dto: CreateDesignationDto, req: any) {
    const systemUserId = req.headers.userid;
    const systemUserInfo = await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId);
    
    // Insert designation data
    const insertedData = await this.designationDaoService.insertDesignationData(
      new DesignationEntity(dto.designation, systemUserId, true),
    );
    
    if (insertedData) {
      // Create activity log for designation creation
      const activityLog = UserActivityLog.createLog(
        `Designation created - ${dto.designation}`,
        'Designation Creation',
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
      
      throw new HttpException({ status: 200, message: 'Created successfully' }, HttpStatus.OK);
    }
  }

  async getDesignation(req: any) {
    const data = await this.designationDaoService.getDesignationBasedOnUserId(req.headers.userid);
    if (data) throw new HttpException({ status: 200, message: 'Data Found', data }, HttpStatus.OK);
  }

  async updateDesignation(dto: UpdateDesignationDto, req: any) {
    const systemUserId = req.headers.userid;
    const systemUserInfo = await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId);
    const { id, designation } = dto;
    
    // Get current designation for logging
    const currentDesignation = await this.designationDaoService.getDesignationBasedOnId(id);
    const previousDesignation = currentDesignation?.designation || 'Unknown designation';
    
    // Update designation
    const updatedData = await this.designationDaoService.updateDesignationData(id, designation);
    
    if (updatedData) {
      // Create activity log for designation update
      const activityLog = UserActivityLog.createLog(
        `Designation updated - ${previousDesignation} to ${designation}`,
        'Designation Update',
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
      
      throw new HttpException({ status: 200, message: 'Updated successfully' }, HttpStatus.OK);
    }
  }
  
  async deleteDesignation(dto: DeleteDesignationDto, req: any) {
    const systemUserId = req.headers.userid;
    const systemUserInfo = await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId);
    const { id } = dto;
    
    // Get designation details before deletion
    const designationData = await this.designationDaoService.getDesignationBasedOnId(id);
    const designationName = designationData?.designation || 'Unknown designation';
    
    // Delete designation
    const deletedData = await this.designationDaoService.deleteDesignationData(id);
    
    if (deletedData) {
      // Create activity log for designation deletion
      const activityLog = UserActivityLog.createLog(
        `Designation deleted - ${designationName}`,
        'Designation Deletion',
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
      
      throw new HttpException({ status: 200, message: 'Deleted successfully' }, HttpStatus.OK);
    }
    
    throw new HttpException({ status: 404, message: 'Designation not found' }, HttpStatus.NOT_FOUND);
  }
}
