import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ReportingQuestionAnswerEntity } from '@modules/reporting_module/entities/reporting_question_answer.entity';
import { FileMetadataEntity } from '@app/modules/files-manager/entities/file-metdata.entity';
import { DocumentEntity, DocumentType, ReportingQuestionMetaTransformer } from './entities/document.entity';
import { Repository } from 'typeorm';
import * as path from 'path';
import axios from 'axios';
import * as crypto from 'crypto';
import * as mime from 'mime-types';
import { v4 as uuidv4 } from 'uuid';
import { FilesManagerDaoService } from '../dao/files-manager-dao/files-manager-dao.service';
import { SuperAdminClientService } from '../super-admin-client/super-admin-client.service';
import { DocumentsDaoService } from '../dao/documents-dao/documents-dao.service';
import { UserDaoService } from '../dao/setting/user-dao/user-dao.service';


@Injectable()
export class ReportingDocumentsMigrationService {
  constructor(
    @InjectRepository(ReportingQuestionAnswerEntity)
    private readonly answerRepo: Repository<ReportingQuestionAnswerEntity>,
    private readonly userDaoService: UserDaoService,
    private readonly fileManagerDaoService: FilesManagerDaoService,
    private readonly documentDaoService: DocumentsDaoService,
    private readonly superAdminClientService: SuperAdminClientService,
  ) {}

  async run() {

    const company = (await this.userDaoService.getHeadOfficeCompanyDetails(true));
    const companyId = company.company_id;
    const startingMonth = company.starting_month;
    const frameworkIds = await this.superAdminClientService.getFrameworkIds(companyId);
    const financialYears = (await this.superAdminClientService.getFinancialYears(companyId)).reduce((acc, fy) => {
      const {fromDate, toDate} = getFinancialYearBounds(fy.financial_year_value, startingMonth);
      fy['fromDate'] = fromDate;
      fy['toDate'] = toDate;
      acc[fy.id] = fy;
      return acc;
    }, {});

    const reportingQuestionsById = (await this.superAdminClientService.getReportingQuestions(companyId, frameworkIds)).reduce((acc, q) => {
      acc[q.questionId] = q;
      return acc;
    }, {});

    const answers = await this.answerRepo.find();
    for (const answer of answers) {

      if (!Array.isArray(answer.proofDocument)) {
        console.warn('proofDocument is not an array:', answer.proofDocument);
        continue;
      }

      let updatedProofDocument = [];
      for (let i = 0; i < answer.proofDocument.length; i++) {
        if (answer.proofDocument[i] == null) {
          console.log('proofDocument is null or undefined:', answer.proofDocument[i]);
          updatedProofDocument.push({});
          continue;
        }

        if (!Array.isArray(answer.proofDocument[i]) && typeof answer.proofDocument[i] !== 'object') {
          console.warn(`proofDocument[${i}] is not an array or object:`, answer.proofDocument[i]);
          updatedProofDocument.push({});
          continue;
        }

        if (!Array.isArray(answer.proofDocument[i]) && typeof answer.proofDocument[i] === 'object') {
          console.log('proofDocument already modified:', answer.proofDocument[i]);
          updatedProofDocument.push(answer.proofDocument[i]);
          continue;
        }

        updatedProofDocument.push({});
        for (let j = 0; j < answer.proofDocument[i].length; j++) {
          if (!answer.proofDocument[i][j]) {
            continue;
          }

          const urls = answer.proofDocument[i][j]
            ?.split(',')
            ?.map(url => url.trim())
            ?.filter(url => url.length > 0);

          if (!urls) {
            console.error(`Invalid urls ${answer.proofDocument[i][j]}`);
            throw new Error(`Invalid urls ${answer.proofDocument[i][j]}`);
          }

          for (const url of urls) {
            if (!url || !url.startsWith('http')){
              throw new Error(`unsupported URL: ${url}`);
            }

            const replacedUrl = url.replace(
                "https://riu-bucket.s3.ap-south-1.amazonaws.com",
                "https://copyadatafromawstoazure.blob.core.windows.net/uploads"
            );

            try {  
              const response = await axios.get(replacedUrl, { responseType: 'arraybuffer' });
              const buffer = Buffer.from(response.data);

              // Determine extension and mimeType
              let mimeType = response.headers['content-type'];
              let ext = mime.extension(mimeType);

              // Extract file name from URL
              const parsedUrl = new URL(replacedUrl);
              const pathname = parsedUrl.pathname;
              let fileName = path.basename(pathname);

              const uuid = uuidv4();
              if (!fileName || !path.extname(fileName)) {
                ext = ext || 'bin';
                fileName = `${uuid}.${ext}`;
              }

              // If ext is still not resolved from content-type, fallback from file name
              if (!ext) {
                ext = path.extname(fileName).replace('.', '') || 'bin';
                mimeType = mime.lookup(ext) || 'application/octet-stream';
              }
              
              const hash = crypto.createHash('sha256').update(buffer).digest('hex');
              const fileMetdataEntity = new FileMetadataEntity();
              Object.assign(fileMetdataEntity, {
                hash,
                uuid,
                fileName: deduplicateAndDecode(fileName),
                mimeType,
                fileSize: buffer.length,
                provider: 'AZURE',
                url: replacedUrl,
                uploadedBy: { id: answer.userId } as any
              });

              let fileMeta = await this.fileManagerDaoService.getFileMetadataByHash(hash);
              if (!fileMeta) {
                console.log('New File');
                fileMeta = await this.fileManagerDaoService.createFileMetadata(fileMetdataEntity);
              } else {
                console.log('Existing File');
                fileMetdataEntity.uuid = fileMeta.uuid;
                await this.fileManagerDaoService.updateFileMetadata(fileMetdataEntity);
                fileMeta = await this.fileManagerDaoService.getFileMetadataByHash(hash);
              }

              const reportingQuestion = reportingQuestionsById[answer.questionId];
              
              if (!reportingQuestion) {
                console.error('reporting question not found: ', answer.questionId);
                continue;
              }

              const documentEntity = new DocumentEntity();
              Object.assign(documentEntity, {
                  documentType: DocumentType.OTHERS,
                  financialYearId: answer.financialYearId,
                  moduleName: reportingQuestion.moduleName,
                  sourceId: answer.sourceId,
                  subLocationId: answer.subLocationId,
                  frequency: reportingQuestion.frequency,
                  fromDate: reportingQuestion.frequency !== 'CUSTOM' ? financialYears[answer.financialYearId]['fromDate']: answer.fromDate,
                  toDate: reportingQuestion.frequency !== 'CUSTOM' ? financialYears[answer.financialYearId]['toDate']: answer.toDate,
                  documentMetadata: {},
                  fileMetadataId: fileMeta.uuid,
                  addToReporting: true,
                  reportingQuestionMeta: {
                    questionId: answer.questionId,
                    row: i
                  },
                  reportingQuestionMetaKey: ReportingQuestionMetaTransformer.to({
                    questionId: answer.questionId, 
                    row: i
                  }),
              });
              
              documentEntity.generateIdentityKey();

              const existingDocument = await this.documentDaoService.getDocumentByIdentityKey(documentEntity.documentIdentityKey);
              if (existingDocument) {
                documentEntity.id = existingDocument.id;
              }

              const reportingDocument = await this.documentDaoService.saveDocument(documentEntity, answer.userId);

              updatedProofDocument[i][reportingDocument.id] = {};
            } catch (err) {
              console.error(`❌ Failed to process URL: ${replacedUrl}`, err.message);
              throw err;
            }
          }
        }
      }

      answer.proofDocument = updatedProofDocument;
    }

    for (const answer of answers) {
      console.log(answer.proofDocument);
      await this.answerRepo.save(answer);
      console.log(`✅ Updated proofDocument for answer ID ${answer.id}`);
    }

    console.log('🎉 Migration completed.');
  }
}

function deduplicateAndDecode(str) {
  const len = str.length;

  // Step 1: Find smallest repeating unit
  for (let i = 1; i <= len / 2; i++) {
    if (len % i === 0) {
      const repeatCount = len / i;
      const unit = str.slice(0, i);
      if (unit.repeat(repeatCount) === str) {
        str = unit;
        break;
      }
    }
  }

  // Step 2: Decode URL
  return decodeURIComponent(str);
}

function getFinancialYearBounds(financialYear: string, financialYearStartMonth: number): { fromDate: string; toDate: string } {
  if (!/^\d{4}-\d{4}$/.test(financialYear)) {
    throw new Error("Invalid financialYear format, expected YYYY-YYYY");
  }

  const [startYearStr, endYearStr] = financialYear.split("-");
  const startYear = Number(startYearStr);
  const endYear = Number(endYearStr);

  if (financialYearStartMonth < 1 || financialYearStartMonth > 12) {
    throw new Error("financialYearStartMonth must be between 1 and 12");
  }

  // Start date
  const fromDate = `${startYear}-${String(financialYearStartMonth).padStart(2, "0")}`;

  // End date is the same month of the endYear
  const toDate = `${endYear}-${String(financialYearStartMonth).padStart(2, "0")}`;

  return { fromDate, toDate };
}


