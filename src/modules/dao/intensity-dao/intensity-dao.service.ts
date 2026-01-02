import { IntensityEntity } from '@modules/intensity/entities/intensity.entity';
import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';

@Injectable()
export class IntensityDaoService {
    private repository: Repository<IntensityEntity>;

    constructor(private dataSource: DataSource) { 
        this.repository = this.dataSource.getRepository(IntensityEntity);
    }

    async getIntensities(
        query: Partial<IntensityEntity>, 
        manager?: EntityManager
    ): Promise<IntensityEntity[]> {
        const repo = manager ? manager.getRepository(IntensityEntity) : this.repository;
        return await repo.find({ where: query });
    }


    async getIntensity(
        query: Partial<IntensityEntity>, 
        manager?: EntityManager
    ): Promise<IntensityEntity | null> {
        const repo = manager ? manager.getRepository(IntensityEntity) : this.repository;
        return await repo.findOne({ where: query });
    }

    async createIntensity(
        data: Partial<IntensityEntity>,
        manager?: EntityManager,
    ): Promise<IntensityEntity> {
        const repo = manager ? manager.getRepository(IntensityEntity) : this.repository;
        const newIntensity = repo.create(data);
        return await repo.save(newIntensity);
    }

    async updateIntensityAnswer(id: number, answer: number, manager?: EntityManager): Promise<void> {
        const repo = manager ? manager.getRepository(IntensityEntity) : this.repository;
        await repo.update(id, { answer });
    }
}
