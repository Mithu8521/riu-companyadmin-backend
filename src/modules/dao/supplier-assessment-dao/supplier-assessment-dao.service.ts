import { AssessmentQuestionDetailsEntity } from '@modules/supplier_assessment/entities/assessment_question_details.entity';
import { AssessmentQuestionEntity } from '@modules/supplier_assessment/entities/create_assessment_question.entity';
import { SupplierAssessmentEntity } from '@modules/supplier_assessment/entities/supplier_assessment.entity';
import { Injectable } from '@nestjs/common';
import { DataSource, In } from 'typeorm';

@Injectable()
export class SupplierAssessmentDaoService {
    constructor(private dataSource: DataSource) { }

    private getRepo(entity: any) {
        return this.dataSource.getRepository(entity);
    }

    async insertAssessment(supplierAssessmentEntity: SupplierAssessmentEntity) {
        return this.getRepo(SupplierAssessmentEntity).save(supplierAssessmentEntity);
    }

    async deleteAssessment(id: number) {
        return (await this.getRepo(SupplierAssessmentEntity).delete({ id })).affected > 0;
    }

    async getAllAssesment(companyId: number) {
        return this.getRepo(SupplierAssessmentEntity).find({ where: { companyId } });
    }

    async getAllAssesmentBasedOnId(id: number) {
        return this.getRepo(SupplierAssessmentEntity).findOne({ where: { id } });
    }

    async updateAssessment(id: number, updatedFields: Partial<SupplierAssessmentEntity>) {
        return this.getRepo(SupplierAssessmentEntity).update({ id }, updatedFields);
    }

    async assignAssessmentToUser(id: number, userIds: string) {
        return this.getRepo(SupplierAssessmentEntity).update({ id }, { userIds });
    }

    async insertAssessmentQuestion(assessmentQuestionEntity: AssessmentQuestionEntity) {
        return this.getRepo(AssessmentQuestionEntity).save(assessmentQuestionEntity);
    }

    async insertAssessmentQuestionDetails(assessmentQuestionDetailsEntity: AssessmentQuestionDetailsEntity[]) {
        return this.getRepo(AssessmentQuestionDetailsEntity).save(assessmentQuestionDetailsEntity);
    }

    async getAssessmentQuestion(financialYearId: number) {
        return this.getRepo(AssessmentQuestionEntity).find({ where: { financialYearId ,createdBy:"COMPANY_ADMIN" } });
    }

    async getAssessmentQuestionBasedIds(ids: number[]) {
        return await this.getRepo(AssessmentQuestionEntity).find({ where: {  id: In(ids) } });
    }

    async getAssessmentQuestionDetails(questionId: number) {
        return this.getRepo(AssessmentQuestionDetailsEntity).find({ where: { questionId } });
    }

    async deleteAssessmentQuestion(id: number) {
        return (await this.getRepo(AssessmentQuestionEntity).delete({ id })).affected > 0;
    }

    async deleteAssessmentQuestionDeatis(questionId: number) {
        return (await this.getRepo(AssessmentQuestionDetailsEntity).delete({ questionId })).affected > 0;
    }
} 