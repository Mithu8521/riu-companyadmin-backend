import { plainToInstance } from "class-transformer";
import { DocumentEntity, ReportingQuestionMetaTransformer } from "../entities/document.entity"; 
import { ReportingQuestionAnswerDTO } from "../dto/reporting-question-answer.dto";
import { SaveDocumentDto } from "../dto/save-document.dto";

export class DocumentTransformer {
  static toReportingQuestionAnswerDTO(entity: DocumentEntity): ReportingQuestionAnswerDTO {
    if (!entity) return null;

    const reportingQuestionMeta = entity.reportingQuestionMeta;

    return plainToInstance(
      ReportingQuestionAnswerDTO,
      {
        documentId: entity.id,
        financialYearId: entity.financialYearId,
        sourceId: entity.sourceId,
        subLocationId: entity.subLocationId,
        moduleName: entity.moduleName,
        frequency: entity.frequency,
        fromDate: entity.fromDate,
        toDate: entity.toDate,

        // Flatten ReportingQuestion into DTO fields
        addToReporting: entity.addToReporting,
        questionId: reportingQuestionMeta?.questionId,
        row: reportingQuestionMeta?.row,
        readingColumn: reportingQuestionMeta?.readingColumn,
        readingUnit: reportingQuestionMeta?.readingUnit,
        readingValue: reportingQuestionMeta?.readingValue,
        addReadings: reportingQuestionMeta?.addReadings,
        operationType: reportingQuestionMeta?.operationType,
      },
      { excludeExtraneousValues: true }
    );
  }

  static fromSaveDocumentDTO(dto :SaveDocumentDto, documentKPIs?: any): DocumentEntity {
    const reportingQuestionMetaKey = ReportingQuestionMetaTransformer.to(dto.reportingQuestionMeta);
    const documentKpiKey = ReportingQuestionMetaTransformer.toDocumentKpiKey(dto.reportingQuestionMeta);
    const documentKpi = documentKPIs?.[documentKpiKey];

    const entity = new DocumentEntity();
    Object.assign(entity, {
      id: dto.id,
      documentType: dto.documentType,
      financialYearId: dto.financialYearId,
      sourceId: dto.sourceId,
      subLocationId: dto.subLocationId,
      frequency: dto.frequency,
      fromDate: dto.fromDate,
      toDate: dto.toDate,
      moduleName: dto.moduleName,
      documentMetadata: dto.documentMetadata,
      fileMetadataId: dto.fileMetadataId,
      addToReporting: dto.addToReporting,
      reportingQuestionMetaKey: reportingQuestionMetaKey,
      reportingQuestionMeta: {
        questionId: dto.reportingQuestionMeta?.questionId,
        row: dto.reportingQuestionMeta?.row,
        readingColumn: dto.reportingQuestionMeta?.readingColumn,
        readingValue: dto.documentMetadata?.['unitsConsumed'],
        readingUnit: documentKpi?.readingUnit,
        addReadings: dto.reportingQuestionMeta?.addReadings,
        operationType: documentKpi?.operationType
      }
    });

    entity.generateIdentityKey();

    return entity;
  }
}
