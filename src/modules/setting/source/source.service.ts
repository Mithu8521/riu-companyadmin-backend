import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { LocationEntity } from './entities/source.entity';
import { CreateSourceDto } from './dto/create-source.dto';
import { SourceDaoService } from '@modules/dao/setting/source-dao/source-dao.service';
import { UserDaoService } from '@modules/dao/setting/user-dao/user-dao.service';
import { UpdateSourceDto } from './dto/update-source.dto';
import { DeleteSourceDto } from './dto/delete-source.dto';
import { CreateSubLocationDto } from './dto/sub-location.dto';
import { SubLocationEntity } from './entities/sub-location.entity';
import { UserActivityLog } from '../user/entities/user_activity_logs';

@Injectable()
export class SourceService {
  constructor(private sourceDaoService: SourceDaoService, private userDaoService: UserDaoService) { }

  async createSource(createSourceDto: CreateSourceDto, req: any) {
    const systemUserId = req.headers.userid;
    const systemUserInfo = await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId);
    
    // Insert the new location
    const newLocation = await this.sourceDaoService.insertLocationData(
      new LocationEntity(
        createSourceDto.location, 
        createSourceDto?.unitCode, 
        systemUserId, 
        false, 
        null, 
        true
      )
    );
    
    if (newLocation) {
      // Create activity log for location creation
      const location = JSON.parse(createSourceDto.location)
      const loc = `${location['area']}, ${location['city']}, ${location['state']}, ${location['country']} - ${location['zipCode']}`;

      const activityLog = UserActivityLog.createLog(
        `Location created - ${loc}`,
        'Location Creation',
        'success',
        systemUserId,
        newLocation.id, // Assuming the inserted location returns its ID
        {
          questionId: null,
          ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
          userAgent: req.headers['user-agent'],
          location: null,
          viewableChanges: {
            location_name: loc,
            unit_code: createSourceDto?.unitCode || null
          },
          metadata: {
            // Standard fields always present
            name: `${systemUserInfo.first_name || ''} ${systemUserInfo.last_name || ''}`.trim(),
            email: systemUserInfo.email,
            updated_time: new Date().toISOString(),
            
            // Action-specific additional data
            created_by: {
              id: systemUserId,
              name: `${systemUserInfo.first_name || ''} ${systemUserInfo.last_name || ''}`.trim(),
              email: systemUserInfo.email
            },
            location_details: {
              name: loc,
              unit_code: createSourceDto?.unitCode || null,
              is_active: true
            },
            action: 'location_creation'
          }
        }
      );
      
      // Save the activity log
      await this.userDaoService.insertTodaysActivityData(activityLog);
      
      throw new HttpException({ status: 200, message: 'Created successfully' }, HttpStatus.OK);
    }
  }

  async createSubLocation(createSubLocationDto: CreateSubLocationDto, req: any) {
    const systemUserId = req.headers.userid;
    const systemUserInfo = await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId);
    const { subLocation, locationId } = createSubLocationDto;
    
    // Get parent location details for context
    const parentLocation = await this.sourceDaoService.getSourceBasedOnId(locationId);
    const parentLocationName = parentLocation ? (parentLocation.location ) : 'Unknown location';
    
    // Insert the new sub-location
    const newSubLocation = await this.sourceDaoService.insertSubLocationData(
      new SubLocationEntity(locationId, subLocation, null, true)
    );

    const location = JSON.parse(parentLocationName)
    const loc = `${location['area']}, ${location['city']}, ${location['state']}, ${location['country']} - ${location['zipCode']}`;
    
    if (newSubLocation) {
      // Create activity log for sub-location creation
      const activityLog = UserActivityLog.createLog(
        `Sub-location created - ${subLocation} under ${loc}`,
        'Sub-Location Creation',
        'success',
        systemUserId,
        newSubLocation.id, // Assuming the inserted sub-location returns its ID
        {
          questionId: null,
          ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
          userAgent: req.headers['user-agent'],
          location: null,
          viewableChanges: {
            sublocation_name: subLocation,
            parent_location: {
              id: locationId,
              name: parentLocationName
            }
          },
          metadata: {
            // Standard fields always present
            name: `${systemUserInfo.first_name || ''} ${systemUserInfo.last_name || ''}`.trim(),
            email: systemUserInfo.email,
            updated_time: new Date().toISOString(),
            
            // Action-specific additional data
            created_by: {
              id: systemUserId,
              name: `${systemUserInfo.first_name || ''} ${systemUserInfo.last_name || ''}`.trim(),
              email: systemUserInfo.email
            },
            sublocation_details: {
              name: subLocation,
              parent_location_id: locationId,
              parent_location_name: loc,
              is_active: true
            },
            action: 'sublocation_creation'
          }
        }
      );
      
      // Save the activity log
      await this.userDaoService.insertTodaysActivityData(activityLog);
      
      throw new HttpException({ status: 200, message: 'Created successfully' }, HttpStatus.OK);
    }
  }

  async getSource(req: any) {
    const { userid: systemUserId } = req.headers;
    const company = await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId);
    const sourceIds = req.query.type === "ALL" ? await this.sourceDaoService.getAllLocation() : JSON.parse(company.source_ids);
    if (sourceIds) {
      const uniqueLocationsMap = new Map<number, any>();
      const subLocations = await this.sourceDaoService.getSubSourceBasedOnIds()
      for (const item of [...await this.sourceDaoService.getSourceBasedOnIds(sourceIds), ...await this.sourceDaoService.getSourceBasedOnUserId(systemUserId)]) {
        const itemId = item.id;
        const subLocation = subLocations.filter((sub) => sub.locationId == itemId); 
        if (!uniqueLocationsMap.has(itemId)) uniqueLocationsMap.set(itemId, { ...item, subLocation, location: JSON.parse(item.location) });
      }

      const parsedLocations = Array.from(uniqueLocationsMap.values());
      if (parsedLocations.length > 0) throw new HttpException({ status: 200, message: 'Data Found', data: parsedLocations }, HttpStatus.OK);

    } else {
      throw new HttpException({ status: 200, message: 'Data Not Found', data: [] }, HttpStatus.OK);
    }
  }

  async updateSource(updateSourceDto: UpdateSourceDto, req: any) {
    const systemUserId = req.headers.userid;
    const systemUserInfo = await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId);
    const { id, company_name, location } = updateSourceDto;
    
    // Get the current source details for comparison
    const currentSource = await this.sourceDaoService.getSourceBasedOnId(id);
    
    // Update the source
    const updatedSource = await this.sourceDaoService.updateSourceData(id, company_name, location);
    
    if (updatedSource) {
      // Create a simple location name for display
      const locationName = currentSource?.location || currentSource?.unitCode || id.toString();
      const location = JSON.parse(locationName)
      const loc = `${location['area']}, ${location['city']}, ${location['state']}, ${location['country']} - ${location['zipCode']}`;
      // Create activity log for source update
      const activityLog = UserActivityLog.createLog(
        `Location updated - ${loc}`,
        'Location Update',
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

  async deleteSource(deleteSourceDto: DeleteSourceDto, req: any) {
    const systemUserId = req.headers.userid;
    const systemUserInfo = await this.userDaoService.getCompanyDetailsBasedOnUserId(systemUserId);
    const { id } = deleteSourceDto;
    
    // Get the location name before deleting
    const sourceData = await this.sourceDaoService.getSourceBasedOnId(id);
    const locationName = sourceData?.location || sourceData?.unitCode || id.toString();
    const location = JSON.parse(locationName)
    const loc = `${location['area']}, ${location['city']}, ${location['state']}, ${location['country']} - ${location['zipCode']}`;
    // Delete the source
    const deleted = await this.sourceDaoService.deleteSourceData(id);
    
    if (deleted) {
      // Create activity log for location deletion
      const activityLog = UserActivityLog.createLog(
        `Location deleted - ${loc}`,
        'Location Deletion',
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
    } else {
      throw new HttpException({ status: 404, message: 'Designation not found' }, HttpStatus.NOT_FOUND);
    }
  }
}
