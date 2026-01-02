import { EmissionScopeEntity } from '@modules/carban_emission/entities/emission_calculation.entity';
import { Injectable } from '@nestjs/common';
import { GHGScope } from '@utils/enums/Status';
import { DataSource, In } from 'typeorm';

@Injectable()
export class CarbonEmissionDaoService {
    constructor(private dataSource: DataSource) { }

    private getRepo(entity: any) {
        return this.dataSource.getRepository(entity);
    }

    async saveEmissionCalculation(emissionCalculation: EmissionScopeEntity) {
        return await this.getRepo(EmissionScopeEntity).save(emissionCalculation);
    }

    async findEmissionCalculation(criteria: any) {
        return await this.getRepo(EmissionScopeEntity).findOne({ where: criteria });
    }

    async findEmissionCalculations(criteria: any) {
    return await this.getRepo(EmissionScopeEntity).find({ where: criteria });
    }

    async findEmissionCalculationBasedOnFinancialYear(
        financialYearId: number,
        ghgScope: GHGScope,
        ghgDatabaseId: number,
    ) {
        return await this.getRepo(EmissionScopeEntity).find({
            where: { financialYearId, ghgScope ,ghgDatabaseId},
        });
    }

    async findEmissionCalculationBasedOnFinancialYearAndQuestionId(financialYearId: number, questionId: number) {
        return await this.getRepo(EmissionScopeEntity).find({ where: { financialYearId, questionId } });
    }
}
