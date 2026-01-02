import { BadRequestException, HttpException, HttpStatus, Injectable, Req, UploadedFile } from '@nestjs/common';
import { SaveDocumentDto } from './dto/save-document.dto';

import { DocumentsDaoService } from '@modules/dao/documents-dao/documents-dao.service';
import { DocumentEntity, OthersMetadata, ReportingQuestionMetaTransformer } from './entities/document.entity';
import { DocumentDto } from './dto/document.dto';
import { FilesManagerService } from '../files-manager/files-manager.service';
import { plainToInstance } from 'class-transformer';
import { CommonUtilityService } from '@utils/common/common-utility/common-utility.service';
import { DocumentType } from './entities/document.entity'; 
import { SuperAdminClientService } from '../super-admin-client/super-admin-client.service';
import { UserService } from '../setting/user/user.service';
import { ListDocumentsDto } from './dto/list-documents.dto';
import { CompanyEntity } from '../setting/user/entities/user.entity';
import { AnswerFrequencyDaoService } from '../dao/setting/answer-frequency-dao/answer-frequency-dao.service';
import { ReportingQuestionAnswerFactory } from './reporting-question-answers/reporting-question-answer.factory';
import { DocumentTransformer } from './transformers/document.transformer';
import { ReportingModuleDaoService } from '../dao/reporting-module-dao/reporting-module-dao.service';


@Injectable()
export class DocumentsService {
  constructor(
    private readonly documentsDaoService: DocumentsDaoService,
    private readonly filesManagerService: FilesManagerService,
    private userService: UserService,
    private reportingModuleDaoService: ReportingModuleDaoService,
    private superAdminClientService: SuperAdminClientService,
    private answerFrequencyDaoService: AnswerFrequencyDaoService,
    private commonUtilityService: CommonUtilityService,
    private reportingQuestionAnswerFactory: ReportingQuestionAnswerFactory,
  ) {
  }

  private async validateRequest(dto: SaveDocumentDto, reportingQuestionsById: any, documentKPIs: any) {
    if (dto.addToReporting) {
      if (!dto.financialYearId) {
        throw new HttpException('Cannot add to reporting without financial year', HttpStatus.BAD_REQUEST);
      }

      if (!dto.moduleName) {
        throw new HttpException('Cannot add to reporting without module', HttpStatus.BAD_REQUEST);
      }

      if (!dto.sourceId) {
        throw new HttpException('Cannot add to reporting without location', HttpStatus.BAD_REQUEST);
      }

      if (!dto.frequency) {
        throw new HttpException('Cannot add to reporting without frequency', HttpStatus.BAD_REQUEST);
      }

      if (!dto.fromDate || !dto.toDate) {
        throw new HttpException('Cannot add to reporting without period', HttpStatus.BAD_REQUEST);
      }

      if (!dto.reportingQuestionMeta?.questionId) {
        throw new HttpException('Cannot add to reporting without reporting question', HttpStatus.BAD_REQUEST);
      }
      
      if (!(dto.reportingQuestionMeta.questionId in reportingQuestionsById)) {
        throw new HttpException('Invalid reporting question', HttpStatus.BAD_REQUEST);
      }

      if (dto.reportingQuestionMeta?.addReadings) {
        const documentKpiKey = ReportingQuestionMetaTransformer.toDocumentKpiKey(dto.reportingQuestionMeta);
        if (!(documentKpiKey in documentKPIs)) {
          throw new HttpException('Add readings is not supported for this question', HttpStatus.BAD_REQUEST);
        }

        if (dto.documentType === DocumentType.BILL && dto.documentMetadata?.['documentSubType'] !== documentKPIs?.[documentKpiKey]?.documentSubType) {
          throw new HttpException(`Invalid Bill Type: ${dto.documentMetadata?.['documentSubType']}`, HttpStatus.BAD_REQUEST);
        }
      }
    } else {
      if (!dto.financialYearId && (dto.moduleName || dto.frequency || dto.fromDate || dto.toDate)) {
        throw new HttpException('Module, Frequency and Period cannot be set without Financial Year', HttpStatus.BAD_REQUEST);
      }

      if (dto.frequency && (!dto.fromDate || !dto.toDate)) {
        throw new HttpException('Frequency cannot be set without Period', HttpStatus.BAD_REQUEST);
      }
    }
  }

  private async validateAndMarkFileMetadataPermanent(fileMetadataId: string, existingDocument?: DocumentEntity) {
    console.log(fileMetadataId);
    const fileMetadata = await this.filesManagerService.getFileMetadata(fileMetadataId);
    console.log(fileMetadata);
    if (!fileMetadata || (existingDocument && existingDocument.fileMetadataId !== fileMetadataId)) {
      throw new HttpException('Invalid File Metadata', HttpStatus.BAD_REQUEST);
    }
    if (fileMetadata?.isTemporary) {
      await this.filesManagerService.updateFileMetadata(fileMetadata.uuid, {
        isTemporary: false,
      });
    }
  }

  async createDocument(req, dto: SaveDocumentDto): Promise<DocumentDto> {
    if (dto.id) {
      throw new HttpException('Update operation not allowed', HttpStatus.BAD_REQUEST);
    }

    const documentKPIs = await this.superAdminClientService.getDocumentKPIs();
    const entity = DocumentTransformer.fromSaveDocumentDTO(dto, documentKPIs);

    const existing = await this.documentsDaoService.getDocumentByIdentityKey(entity.documentIdentityKey);

    if (existing) {
      throw new HttpException(
        `Document already exists`,
        HttpStatus.CONFLICT
      );
    }

    const company: CompanyEntity = await this.userService.getCompany(req?.headers?.userid);
    if (!company?.company_id) {
      throw new HttpException('Company not found', HttpStatus.NOT_FOUND);
    }

    const companyId = company.company_id;
    const frameworkIds = await this.superAdminClientService.getFrameworkIds(companyId);

    const reportingQuestionsById = await this.getReportingQuestions(companyId, frameworkIds);

    // Validations
    await this.validateRequest(dto, reportingQuestionsById, documentKPIs);
    await this.validateAndMarkFileMetadataPermanent(dto.fileMetadataId);

    const saved = await this.documentsDaoService.saveDocument(entity, req.headers.userid);
    const populated = await this.documentsDaoService.getDocument(saved.id);

    try {
      if (populated.addToReporting) {
        await this.addToReporting(req, populated, reportingQuestionsById);
      }
    } catch (error) {
      console.error(`Reporting update failed for document ${populated.id}:`, error);
    }

    return plainToInstance(DocumentDto, populated);
  }

  async updateDocument(req, documentId, dto: SaveDocumentDto): Promise<DocumentDto> {

    if (isNaN(Number(documentId))) {
      throw new HttpException('Invalid Document ID', HttpStatus.BAD_REQUEST);
    }

    // ✅ Step 1: Ensure document exists
    const existing = await this.documentsDaoService.getDocument(Number(documentId));
    if (!existing) {
      throw new HttpException('Document not found', HttpStatus.NOT_FOUND);
    }

    const documentKPIs = await this.superAdminClientService.getDocumentKPIs();
    const entity = DocumentTransformer.fromSaveDocumentDTO(dto, documentKPIs);

    const company: CompanyEntity = await this.userService.getCompany(req?.headers?.userid);
    if (!company?.company_id) {
      throw new HttpException('Company not found', HttpStatus.NOT_FOUND);
    }

    const companyId = company.company_id;
    const frameworkIds = await this.superAdminClientService.getFrameworkIds(companyId);

    const reportingQuestionsById = await this.getReportingQuestions(companyId, frameworkIds);

    await this.validateRequest(dto, reportingQuestionsById, documentKPIs);
    await this.validateAndMarkFileMetadataPermanent(dto.fileMetadataId, existing);

    // ✅ Step 2: Handle reporting in correct order
    try {
      // (1) Remove from old reporting if it was previously added
      if (existing.addToReporting) {
        await this.removeFromReporting(req, existing, reportingQuestionsById);
      }

      // (2) Update document (persist changes)
      const saved = await this.documentsDaoService.saveDocument(entity, req.headers.userid);
      const populated = await this.documentsDaoService.getDocument(saved.id);

      // (3) Add to reporting if required
      if (populated.addToReporting) {
        await this.addToReporting(req, populated, reportingQuestionsById);
      }

      return plainToInstance(DocumentDto, populated);
    } catch (error) {
      console.error(`Reporting update failed for document ${entity.id}:`, error);
      throw new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR); // ✅ propagate instead of silently swallowing, since this is update flow
    }
  }

  async deleteDocument(req, documentId): Promise<any> {
    if (isNaN(Number(documentId))) {
      throw new HttpException('Invalid Document ID', HttpStatus.BAD_REQUEST);
    }

    // ✅ Step 1: Ensure document exists
    const existing = await this.documentsDaoService.getDocument(Number(documentId));
    if (!existing) {
      throw new HttpException('Document not found', HttpStatus.NOT_FOUND);
    }

    const company: CompanyEntity = await this.userService.getCompany(req?.headers?.userid);
    if (!company?.company_id) {
      throw new HttpException('Company not found', HttpStatus.NOT_FOUND);
    }

    const companyId = company.company_id;
    const frameworkIds = await this.superAdminClientService.getFrameworkIds(companyId);

    const reportingQuestionsById = await this.getReportingQuestions(companyId, frameworkIds);

    try {
      // (1) Remove from old reporting if it was previously added
      if (existing.addToReporting) {
        await this.removeFromReporting(req, existing, reportingQuestionsById);
      }

      await this.documentsDaoService.deleteDocument(documentId);

      return {
        message: `Document ${documentId} successfully deleted`
      };
    } catch (error) {
      console.error(`Failed to delete document ${documentId}:`, error);
      throw new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR); // ✅ propagate instead of silently swallowing, since this is update flow
    }

  }

  async getDocument(request, documentId: number): Promise<DocumentDto> {
    const document = await this.documentsDaoService.getDocument(documentId);

    if (!document) return null;

    this.syncDocumentWithReporting([document]);

    return plainToInstance(DocumentDto, { ...document, });
  }

  async listDocuments(request): Promise<ListDocumentsDto> {
    const documents = await this.documentsDaoService.listDocuments();

    this.syncDocumentWithReporting(documents);

    return {
      documents: plainToInstance(DocumentDto, documents.map(document => ({ ...document,})))
    };
  }

  async parseAndUploadDocument(@Req() req, @UploadedFile() file: Express.Multer.File): Promise<Partial<DocumentDto>> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const company: CompanyEntity = await this.userService.getCompany(req?.headers?.userid);
    const financialYearStartMonth = company?.starting_month ?? 4;

    if (!company?.company_id) {
        throw new HttpException('Company not found', HttpStatus.NOT_FOUND);
    }

    const companyId = company.company_id;
    const frameworkIds = await this.superAdminClientService.getFrameworkIds(companyId);
    const reportingQuestions = await this.getReportingQuestions(companyId, frameworkIds);
    const documentKPIs = await this.superAdminClientService.getDocumentKPIs();

    // For non existing files, a new file with temporary status will be created.
    req.body.isTemporary = 'true';
    const fileMetadata = await this.filesManagerService.uploadFile(req, file);

    let billInfo;
    try {
      billInfo = await this.superAdminClientService.parseDocument(file);
    } catch (error) {
      console.error('Error Parsing Document: ', error);
    }


    if (billInfo) {

      let billStartDate = billInfo['billingStartDate']
      let billEndDate = billInfo['billingEndDate']
      let billDate = billInfo['billDate']
      if (billStartDate && billEndDate) {
        billInfo['billingMonth'] = CommonUtilityService.extractMonthFromDateRange(billStartDate, billEndDate);
      } else {
        billInfo['billingMonth'] = CommonUtilityService.extractMonthFromDateRange(billDate);
      }

      const billFinancialYear: { id: number, financial_year_value: string } = await this.extractFinancialYear(
        companyId, billInfo['billingMonth'], financialYearStartMonth, true);

      let reportingFrequency;
      if (billFinancialYear?.id) {
        const reportingFrequencies = await this.answerFrequencyDaoService.getAnswerFrequency(billFinancialYear.id);
        reportingFrequency = reportingFrequencies && reportingFrequencies.length ? reportingFrequencies[0].frequency : 'YEARLY';
      }
      const {fromDate, toDate} = this.commonUtilityService.getReportingPeriod(billInfo['billingMonth'], financialYearStartMonth, reportingFrequency);

      const reportingQuestionMeta = Object.values(documentKPIs).find(
        q => (q['documentSubType'] === billInfo['documentSubType'] && q['questionId'] in reportingQuestions
      ));
      const addToReporting = !!reportingQuestionMeta;

      const responseData = {
        financialYearId: billFinancialYear?.id,
        reportingQuestionMeta: reportingQuestionMeta,
        addToReporting: addToReporting,
        documentType: billInfo ? DocumentType.BILL : DocumentType.OTHERS,
        documentMetadata: billInfo,
        fileMetadataId: fileMetadata?.data.uuid,
        fileMetadata: fileMetadata?.data,
        isExisting: fileMetadata?.isExisting,
        frequency: reportingFrequency,
        fromDate: fromDate,
        toDate: toDate,
        moduleName: reportingQuestions?.[reportingQuestionMeta?.['questionId']]?.moduleName
      };

      return Object.fromEntries(
        Object.entries(responseData).filter(([_, v]) => v !== undefined)
      );
    }

    return {
        documentType: billInfo ? DocumentType.BILL : DocumentType.OTHERS,
        documentMetadata: {} as OthersMetadata,
        fileMetadataId: fileMetadata?.data.uuid,
        fileMetadata: fileMetadata?.data,
        isExisting: fileMetadata?.isExisting
      };
    
  }

  async getDocumentKPIs(@Req() req) {
    return await this.superAdminClientService.getDocumentKPIs();
  }

  /**
   * 
   * @param companyId 
   * @param month "YYYY-MM"
   * @param financialYearStartMonth 1
   * @returns 
   */
  private async extractFinancialYear(companyId: number, month: string, financialYearStartMonth: number, fallbackToLatest?: boolean): Promise<{ id: number; financial_year_value: string }> {
    const validFinancialYears = await this.superAdminClientService.getFinancialYears(companyId);

    // Split the month string (e.g., "2025-03")
    const [yearStr, monthStr] = month.split("-");
    const year = parseInt(yearStr, 10);
    const monthNum = parseInt(monthStr, 10);

    // Compute financial year
    const financialYear = CommonUtilityService.getFinancialYear(monthNum, year, financialYearStartMonth);

    // Find matching financial year
    const financialYearInfo = Object.values(validFinancialYears).find(
      (yearInfo: any) => yearInfo.financial_year_value === financialYear
    );

    // If not found and fallbackToLatest is true → pick the latest
    if (!financialYearInfo && fallbackToLatest && validFinancialYears?.length > 0) {
      const sortedYears = [...validFinancialYears].sort((a, b) =>
        a.financial_year_value.localeCompare(b.financial_year_value)
      );
      return sortedYears[sortedYears.length - 1];
    }

    return financialYearInfo as { id: number; financial_year_value: string };
  }

  private async getReportingQuestions(companyId: number, frameworkIds: number[]) {
    return (await this.superAdminClientService.getReportingQuestions(companyId, frameworkIds)).reduce((acc, rq) => {
      acc[rq.questionId] = rq;
      return acc;
    }, {});
  }

  // --- Helper methods ---
  private async addToReporting(req, document: DocumentEntity, reportingQuestionsById: Record<string, any>) {
    const reportingQuestion = reportingQuestionsById[document.reportingQuestionMeta?.questionId];
    const reportingQuestionAnswer = this.reportingQuestionAnswerFactory.getReportingQuestionAnswer(
      reportingQuestion?.questionType
    );
    const reportingQuestionAnswerDto = DocumentTransformer.toReportingQuestionAnswerDTO(document);
    return reportingQuestionAnswer.save(req, reportingQuestionAnswerDto, reportingQuestion);
  }

  private async removeFromReporting(req, document: DocumentEntity, reportingQuestionsById: Record<string, any>) {
    const reportingQuestion = reportingQuestionsById[document.reportingQuestionMeta?.questionId];
    const reportingQuestionAnswer = this.reportingQuestionAnswerFactory.getReportingQuestionAnswer(
      reportingQuestion?.questionType
    );
    const reportingQuestionAnswerDto = DocumentTransformer.toReportingQuestionAnswerDTO(document);
    return reportingQuestionAnswer.remove(req, reportingQuestionAnswerDto, reportingQuestion);
  }

  private async syncDocumentWithReporting(documents) {
    for (const document of documents) {
      if (document.addToReporting) {
        const answers = await this.reportingModuleDaoService.getReportingAnswer(document.reportingQuestionMeta.questionId, document.financialYearId);
        const answer = answers.find(ans => (
          ans.questionId == document.reportingQuestionMeta.questionId &&
          ans.financialYearId == document.financialYearId &&
          ans.sourceId == document.sourceId &&
          ans.subLocationId == document.subLocationId &&
          (document.frequency !== "CUSTOM" ||
            (ans.fromDate === document.fromDate && ans.toDate === document.toDate))
        ));

        if (!answer || 
          (document.reportingQuestionMeta.row != null && 
            answer?.proofDocument?.[document.reportingQuestionMeta.row] && 
              !(document.id in answer.proofDocument[document.reportingQuestionMeta.row])) ||
          (document.reportingQuestionMeta.row == null && 
            answer?.proofDocument?.[0] && 
              !(document.id in answer.proofDocument[0]))) {
          document.addToReporting = false;
          document.reportingQuestionMeta = {questionId: null};
          document.reportingQuestionMetaKey = null;
          document.generateIdentityKey();
          await this.documentsDaoService.saveDocument(document, document.updatedById);
        }
      }
    }
  }

}