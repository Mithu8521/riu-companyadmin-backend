import { Injectable } from '@nestjs/common';
import { DocumentsDaoService } from '../dao/documents-dao/documents-dao.service';
import { SectorQuestionDaoModuleService } from '../dao/sector-question-dao-module/sector-question-dao-module.service';
import { SectorQuestionAnswerEntity } from '../sector_question/entities/sector_question_answers.entity';
import { SectorQuestionTabularAnswerEntity } from '../sector_question/entities/sector_tabular_question_answer.entity';
import { SectorQuestionTrendsAnswerEntity } from '../sector_question/entities/sector_question_trends_answer.entity';


@Injectable()
export class SectorDocumentsMigrationService {
  constructor(
    private readonly documentDaoService: DocumentsDaoService,
    private readonly sectorQuestionDaoModuleService: SectorQuestionDaoModuleService,

  ) {}

  async run() {

    const documentsByFileUrl = (await this.documentDaoService.listDocuments()).reduce((acc, doc) => {
      acc[doc.fileMetadata.url] = doc.id;
      return acc;
    }, {});

    const sectorQuestionAnswers: SectorQuestionAnswerEntity[] = (await this.sectorQuestionDaoModuleService.getAllExistingRecordAnswer()) as SectorQuestionAnswerEntity[];
    const tabularQuestionAnswers: SectorQuestionTabularAnswerEntity[] = (await this.sectorQuestionDaoModuleService.getAllExistingRecordTabularAnswer()) as SectorQuestionTabularAnswerEntity[];
    const trendsQuestionAnswers: SectorQuestionTrendsAnswerEntity[] = (await this.sectorQuestionDaoModuleService.getAllExistingRecordTrendsAnswer()) as SectorQuestionTrendsAnswerEntity[];

    for (const answer of sectorQuestionAnswers) {
      const proofDocument = this.convertProofDocument(answer.proofDocument?.flat(Infinity), documentsByFileUrl);
      answer.proofDocument = proofDocument;
      await this.sectorQuestionDaoModuleService.saveSectorQuestionAnswer(answer);
    }
    
    for (const answer of tabularQuestionAnswers) {
      const proofDocument = this.convertProofDocument(answer.proofDocument?.flat(Infinity), documentsByFileUrl);
      answer.proofDocument = proofDocument;
      await this.sectorQuestionDaoModuleService.saveSectorQuestionTabularAnswer(answer);
    }

    for (const answer of trendsQuestionAnswers) {
      const proofDocument = this.convertProofDocument(answer.proofDocument?.flat(Infinity), documentsByFileUrl);
      answer.proofDocument = proofDocument;
      await this.sectorQuestionDaoModuleService.saveSectorQuestionTrendsAnswer(answer);
    }
  }

  private convertProofDocument(proofDocument, documentsByFileUrl) {
    if (!proofDocument) return [];

    const updatedProofDocument = [];
    for (const obj of proofDocument) {
      if (typeof obj === 'string') {
        const urls = obj.split(',').map(url => url.trim());
        for (const url of urls) {
          const replacedUrl = url.replace(
              "https://riu-bucket.s3.ap-south-1.amazonaws.com",
              "https://copyadatafromawstoazure.blob.core.windows.net/uploads"
          );
          if (replacedUrl in documentsByFileUrl) {
            updatedProofDocument.push({
              [documentsByFileUrl[replacedUrl]]: {}
            });
          }
        }
      } else if (obj) {
        updatedProofDocument.push(obj);
      } else {
        console.log(`cannot add ${obj}`);
      }
    }
    console.log(proofDocument, updatedProofDocument);
    return updatedProofDocument;
  }
}
