import { EmissionSetting } from '@modules/setting/emission/entities/emission.entity';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class EmissionDaoService {
    constructor(private dataSource: DataSource) { }

    private getRepo(entity: any) {
        return this.dataSource.getRepository(entity);
    }

    async getAnswerEmission(questionId: number) {
        return this.getRepo(EmissionSetting).findOne({ where: { questionId } });
    }

    async getAnswerEmissions() {
        return this.getRepo(EmissionSetting).find();
    }    

    async updateEmission(questionId: number, emissionSetting: EmissionSetting) {
        return this.getRepo(EmissionSetting).update({ questionId }, emissionSetting);
    }

    async saveEmission(emissionSetting: EmissionSetting) {
        return this.getRepo(EmissionSetting).save(emissionSetting);
    }
}