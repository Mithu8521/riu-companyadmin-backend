import { ExternalApiCallService } from "@app/utils/common/external-api-call/external-api-call.service";
import { HttpException, HttpStatus, Injectable, UploadedFile } from "@nestjs/common";


@Injectable()
export class SuperAdminClientService {
    constructor(
        private externalApiCallService: ExternalApiCallService,
    ) {}

    async getFrameworkIds(companyId: number): Promise<number[]> {
        try {
            const response = await this.externalApiCallService.getReq(
                process.env.COMPANY_SERVER_API_URL + 'getFramework',
                { companyId: companyId, type: 'ALL', user_type_code: 'company' },
                {},
            );
            const frameworkIds: number[] = response?.data?.map((obj: any) => obj.id);
            if (!frameworkIds || frameworkIds.length === 0) {
                throw new HttpException('No Frameworks found', HttpStatus.NOT_FOUND);
            }
            return frameworkIds;
        } catch (error) {
            console.error(`getFrameworkIds error for companyId ${companyId}: `, error);
            throw new HttpException('Error fetching frameworkIds', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getReportingQuestions(companyId: number, frameworkIds?: number[]) {
        try {
            const queryParam = {
                company_id: companyId,
                user_type_code: 'COMPANY',
            };

            if (frameworkIds) {
                queryParam['framework_ids'] = JSON.stringify(frameworkIds);
            }

            const reportingQuestions = await this.externalApiCallService.getReq(
                process.env.COMPANY_SERVER_API_URL + 'getReportingQuestion',
                queryParam,
                {},
            );

            if (!reportingQuestions?.data) {
                throw new HttpException('No related reporting questions found', HttpStatus.NOT_FOUND);
            }

            return reportingQuestions?.data;
        } catch (error) {
            console.error(`getReportingQuestions error for companyId ${companyId} and frameworkIds ${frameworkIds}: `, error);
            throw new HttpException('Error fetching reporting question', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getFinancialYears(companyId: number) {
        try {
            let queryParam = {
                userId: companyId,
                type: 'COMPANY',
            };
            const financialYears = await this.externalApiCallService.getReq(
                process.env.COMPANY_SERVER_API_URL + 'getFinancialYear',
                queryParam,
                {},
            );

            if (!financialYears?.data) {
                throw new HttpException('No valid financial year found', HttpStatus.NOT_FOUND);
            }

            return financialYears?.data;
        } catch (error) {
            console.error(`getFinancialYear error for companyId ${companyId}: `, error);
            throw new HttpException('Error fetching financial years', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getTrainingCategories(companyId: number) {
        try {
            let queryParam = {
                company_id: companyId,
                user_type_code: 'COMPANY',
            };
            const trainingCategoryResponse = await this.externalApiCallService.getReq(
                process.env.COMPANY_SERVER_API_URL + 'getTrainingCategories',
                queryParam,
                {},
            );

            if (!trainingCategoryResponse?.data) {
                throw new HttpException('No valid financial year found', HttpStatus.NOT_FOUND);
            }

            return trainingCategoryResponse?.data?.trainingCategories;
        } catch (error) {
            console.error(`getTrainingCategoryError error for companyId ${companyId}: `, error);
            throw new HttpException('Error fetching Training Category', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getGraphMappingData(companyId: number, frameworkIds) {
        try {
            let queryParam = {
                company_id: companyId,
                user_type_code: 'COMPANY',
                frameworkId:frameworkIds
            };
            const graphMappingResponse = await this.externalApiCallService.getReq(
                process.env.COMPANY_SERVER_API_URL + 'graph/mapping',
                queryParam,
                {},
            );

            if (!graphMappingResponse?.data) {
                throw new HttpException('No valid financial year found', HttpStatus.NOT_FOUND);
            }

            return graphMappingResponse?.data;
        } catch (error) {
            console.error(`graphMappingResponse error for companyId ${companyId}: `, error);
            throw new HttpException('Error fetching Training Category', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async parseDocument(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
        }

        try {
            const documentInfo = await this.externalApiCallService.postFormDataReq(
                file,
                `${process.env.COMPANY_SERVER_API_URL}documents/parse`,
            );

            if (!documentInfo?.data) {
                throw new HttpException('Failed parsing document', HttpStatus.NOT_FOUND);
            }

            return documentInfo.data;
        } catch (error) {
            console.error(`parseDocument error: `, error);
            throw new HttpException('Error parsing document', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getDocumentKPIs() {
        try {
            const queryParam = {};

            const documentKPIs = await this.externalApiCallService.getReq(
                process.env.COMPANY_SERVER_API_URL + 'documents/kpis',
                queryParam,
                {},
            );

            if (!documentKPIs) {
                console.log('documentKPIs not found', documentKPIs);
                throw new HttpException('Document KPIs not found', HttpStatus.INTERNAL_SERVER_ERROR);
            }

            return documentKPIs;
        } catch (error) {
            console.error(`failed to fetch documentKPIs: `, error);
            throw new HttpException('Failed to fetch Document KPIs', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getGraphInsights(category: string, data: {}, provider: string) {
        try {
            const reqBody = {
                category,
                data: JSON.stringify(data),
                provider
            };

            const graphInsights = await this.externalApiCallService.postReq(
                {},
                reqBody,
                process.env.COMPANY_SERVER_API_URL + 'graph/insights',
            );

            if (!graphInsights) {
                console.log('Error fetching graph insights', graphInsights);
                throw new HttpException('Error fetching graph insights', HttpStatus.INTERNAL_SERVER_ERROR);
            }

            return graphInsights;
        } catch (error) {
            console.error(`failed to fetch graph insights: `, error);
            throw new HttpException('Failed to fetch graph insights', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}