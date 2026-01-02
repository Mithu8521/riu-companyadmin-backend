import { LocationEntity } from '@modules/setting/source/entities/source.entity';
import { SubLocationEntity } from '@modules/setting/source/entities/sub-location.entity';
import { Injectable } from '@nestjs/common';
import { DataSource, In } from 'typeorm';

@Injectable()
export class SourceDaoService {
  constructor(private dataSource: DataSource) { }

  private getRepo(entity: any) {
    return this.dataSource.getRepository(entity);
  }

  async insertLocationData(locationEntity: LocationEntity) {
    return await this.dataSource
      .getRepository(LocationEntity)
      .save(locationEntity);
  }

  async insertSubLocationData(subLocationEntity: SubLocationEntity) {
    return await this.dataSource.getRepository(SubLocationEntity).save(subLocationEntity);
  }  

  async updateSourceData(id: number, company_name: string, location: string) {
    const currentDate = new Date();
    const updateData: { company_name?: string; location?: string; updatedAt: Date } = {
      updatedAt: currentDate,
    };
    if (company_name) {
      updateData.company_name = company_name;
    }
    if (location) {
      updateData.location = location;
    }
    const result = await this.dataSource
      .createQueryBuilder()
      .update(LocationEntity)
      .set(updateData)
      .where('id = :id', { id })
      .execute();

    return result.affected;
  }


  async deleteSourceData(id: number) {
    const result = await this.dataSource
      .getRepository(LocationEntity)
      .delete(id);
    return result.affected > 0;
  }

  async getSourceBasedOnUserId(created_by: number) {
    let sourceDetails = await this.dataSource
      .getRepository(LocationEntity)
      .find({
        where: {
          created_by,
        },
      });
    return sourceDetails;
  }
  async getSourceBasedOnId(id: number) {
    let sourceDetails = await this.dataSource
      .getRepository(LocationEntity)
      .findOne({
        where: {
          id,
        },
      });
    return sourceDetails;
  }

  async getSourceBasedOnIds(ids: number[]) {
    let sourceDetails = await this.dataSource
      .getRepository(LocationEntity)
      .find({
        where: {
          id: In(ids),
        },
      });
    return sourceDetails;
  }

  async getSubSourceBasedOnIds() {
    let sourceDetails = await this.dataSource
      .getRepository(SubLocationEntity)
      .find({
        where: {},
      });
    return sourceDetails;
  }

  async getHeadOffice() {
    let sourceDetails = await this.dataSource
      .getRepository(LocationEntity)
      .findOne({
        where: {
          head_Office: true,
        },
      });
    return sourceDetails;
  }
  async getAllLocation() {
    let sourceDetails = await this.dataSource
      .getRepository(LocationEntity)
      .find({
        where: { is_deletable: false },
      });
    return sourceDetails.map(obj => obj.id);
  }

   async getAllLocationName() {
    let sourceDetails = await this.dataSource
      .getRepository(LocationEntity)
      .find({
        where: { is_deletable: false },
      });
    return sourceDetails;
  }

  async getAllLocationWithSubLocation() {
    const locations = await this.dataSource
      .getRepository(LocationEntity)
      .createQueryBuilder('l')
      .leftJoin(
        SubLocationEntity,
        'sl',
        'sl.locationId = l.id AND sl.isDeletable = false'
      )
      .where('l.is_deletable = false')
      .select([
        'l.id AS locationId',
        'l.location AS locationName',
        'l.unitCode AS unitCode',
        'sl.id AS subLocationId',
        'sl.subLocation AS subLocationName',
      ])
      .orderBy('l.id', 'ASC')
      .addOrderBy('sl.id', 'ASC')
      .getRawMany();

    const result = [];
    for (const row of locations) {
      let loc = result.find(r => r.id === row.locationId);

      if (!loc) {
        loc = {
          id: row.locationId,
          location: JSON.parse(row.locationName),
          unitCode: row.unitCode,
          subLocations: [],
        };
        result.push(loc);
      }

      if (row.subLocationId) {
        loc.subLocations.push({
          id: row.subLocationId,
          name: row.subLocationName,
        });
      }
    }

    return result;
  }


  async updateDeletable(ids: number[]) {
    return this.getRepo(LocationEntity).update({ id: In(ids) }, { is_deletable: false });
  }

  async getSubLocationBySourceId(id: number) {
    let sourceDetails = await this.dataSource
      .getRepository(SubLocationEntity)
      .find({
        where: {
          locationId: id,
        },
      });
    return sourceDetails;
  }

}
