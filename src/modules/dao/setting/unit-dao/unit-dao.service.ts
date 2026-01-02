import { Unit } from '@modules/setting/unit/entities/unit.entity';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class UnitDaoService {
    constructor(private dataSource: DataSource) { }

    private getRepo(entity: any) {
        return this.dataSource.getRepository(entity);
    }

    async getUnit(catagoryId: number) {
        return this.getRepo(Unit).findOne({ where: { catagoryId } });
    }

    async getAllUnit() {
        return this.getRepo(Unit).find();
    }

    async saveUnit(unit: Unit) {
        return this.getRepo(Unit).save(unit);
    }

    async updateUnit(catagoryId: number, unit: string) {
        return this.getRepo(Unit).update({ catagoryId }, { unit });
    }
}
