import { IntensityDaoService } from '@modules/dao/intensity-dao/intensity-dao.service';
import { UserDaoService } from '@modules/dao/setting/user-dao/user-dao.service';
import { HttpException, HttpStatus, Injectable, Req } from '@nestjs/common';
import { ExternalApiCallService } from '@utils/common/external-api-call/external-api-call.service';
import { MetricCalculatorFactory } from './metric-calculator/metric-calculator.factory';
import { IntensityMetricDto } from './dto/intensity-metric.dto';
import { DataSource } from 'typeorm';
import { ReportingModuleDaoService } from '@modules/dao/reporting-module-dao/reporting-module-dao.service';
import { ReportingQuestionAnswerEntity } from '@modules/reporting_module/entities/reporting_question_answer.entity';
import { IntensityDto } from './dto/intensity.dto';
import { IntensityQuestionAnswerDto } from './dto/intensity-question-answer.dto';
import { IntensityEntity } from './entities/intensity.entity';
import { IntensityType } from './enums/intensity-type.enum';
import { UserService } from '../setting/user/user.service';
import { SuperAdminClientService } from '../super-admin-client/super-admin-client.service';

@Injectable()
export class IntensityService {
  constructor(
    private dataSource: DataSource,
    private intensityDaoService: IntensityDaoService,
    private userService: UserService, 
    private externalApiCallService: ExternalApiCallService, 
    private metricCalculatorFactory: MetricCalculatorFactory,
    private reportingModuleDaoService : ReportingModuleDaoService,
    private superAdminClientService: SuperAdminClientService
  ) {}

  async getIntensity(request, queryParams): Promise<IntensityDto[]> {
    const userId = request?.headers?.userid;
    const companyId = await this.userService.getCompanyId(+userId);
    const {financialYearId, intensityType} = queryParams;
    const frameworkIds = await this.superAdminClientService.getFrameworkIds(companyId);
    
    const intensityQuestions = await this.getIntensityQuestions(request, companyId, frameworkIds);
    const intensityReportingQuestions = intensityQuestions.flatMap(intensityQuestion => intensityQuestion.reportingQuestions || []);

    const savedIntensitiesMap: Record<string, IntensityEntity> = (await this.intensityDaoService.getIntensities({financialYearId}))
      .reduce((acc, savedIntensity) => {
        const key = `${savedIntensity.financialYearId}-${savedIntensity.sourceId}-${savedIntensity.subLocationId}-${savedIntensity.fromDate}-${savedIntensity.toDate}-${savedIntensity.questionId}`;
        acc[key] = savedIntensity;
        return acc;
      }, {});
    const intensityReportingQuestionAnswers = await this.getIntensityReportingQuestionAnswers(intensityReportingQuestions, financialYearId, frameworkIds)
    
    let intensityMetrics = [];
    if (intensityType) {
      intensityMetrics = await this.getIntensityMetrics(frameworkIds, financialYearId, intensityType);
    } else {
      for(const intensityType of Object.values(IntensityType) as IntensityType[]) {
        intensityMetrics.push(...(await this.getIntensityMetrics(frameworkIds, financialYearId, intensityType)));
      }
    }

    return intensityMetrics.map(intensityMetric => {
      const intensity = new IntensityDto();
      intensity.financialYearId = intensityMetric.financialYearId;
      intensity.type = intensityMetric.intensityType;
      intensity.sourceId = intensityMetric.sourceId;
      intensity.subLocationId = intensityMetric.subLocationId;
      intensity.fromDate = intensityMetric.fromDate;
      intensity.toDate = intensityMetric.toDate;
      intensity.intensityQuestionAnswers = [];

      for (const intensityQuestion of intensityQuestions) {
        const intensityQuestionAnswer = new IntensityQuestionAnswerDto();
        intensityQuestionAnswer.questionId = intensityQuestion['id'];
        intensityQuestionAnswer.title = intensityQuestion['title'];
        intensityQuestionAnswer.metricValue = intensityMetric.metricValue;

        const key = `${intensity.financialYearId}-${intensity.sourceId}-${intensity.subLocationId}-${intensity.fromDate}-${intensity.toDate}-${intensityQuestionAnswer.questionId}`;
        const savedIntensity = savedIntensitiesMap[key];
        intensityQuestionAnswer.answer = savedIntensity?.answer;

        for (const intensityReportingQuestion of intensityQuestion['reportingQuestions']) {
          const key = `${intensity.financialYearId}-${intensity.sourceId}-${intensity.subLocationId}-${intensity.fromDate}-${intensity.toDate}-${intensityReportingQuestion}`;
          const intensityReportingQuestionAnswer = intensityReportingQuestionAnswers[intensityReportingQuestion];
          intensityQuestionAnswer.isAnswerEditable = false;
          if (intensityReportingQuestionAnswer && intensityReportingQuestionAnswer[key] && intensityReportingQuestionAnswer[key]['answer']) {
             intensityQuestionAnswer.answer = intensityReportingQuestionAnswer[key]['answer'];
             break;
          }
        }

        intensity.intensityQuestionAnswers.push(intensityQuestionAnswer);
      }

      return intensity;
    });
  }

  async saveIntensity(request, body) {
    const userId = request?.headers?.userid;
    const companyId = await this.userService.getCompanyId(+userId);
    const frameworkIds = await this.superAdminClientService.getFrameworkIds(companyId);
    const instensityQuestionMap = (await this.getIntensityQuestions(request, companyId, frameworkIds)).reduce((acc, intensityQuestion) => {
      acc[intensityQuestion.id] = intensityQuestion;
      return acc;
    }, {});

    const intensityToSave = JSON.parse(body.intensity);

    try {
      await this.dataSource.transaction(async (manager) => {
        for (const saveIntensityDto of intensityToSave) {
          const intensityReportingQuestions = instensityQuestionMap[saveIntensityDto.intensityQuestionId]?.reportingQuestions || [];
          
          if (intensityReportingQuestions.length > 0 && (!saveIntensityDto.answer || saveIntensityDto.answer.toString().trim() === '')) {
            continue;
          }

          const existingIntensity = await this.intensityDaoService.getIntensity({
              financialYearId: saveIntensityDto.financialYearId,
              questionId: saveIntensityDto.questionId,
              fromDate: saveIntensityDto.fromDate,
              toDate: saveIntensityDto.toDate,
              sourceId: saveIntensityDto.sourceId,
              subLocationId: saveIntensityDto.subLocationId
            },
            manager
          );

          if (existingIntensity) {
            await this.intensityDaoService.updateIntensityAnswer(existingIntensity.id, saveIntensityDto.answer, manager);
          } else {
            await this.intensityDaoService.createIntensity({
              userId: +userId,
              financialYearId: saveIntensityDto.financialYearId,
              questionId: saveIntensityDto.questionId,
              fromDate: saveIntensityDto.fromDate,
              toDate: saveIntensityDto.toDate,
              sourceId: saveIntensityDto.sourceId,
              subLocationId: saveIntensityDto.subLocationId,
              answer: saveIntensityDto.answer,
            }, manager);
          }
        }
      });
    } catch (error) {
      console.error('Transaction failed in saveIntensity', error);
      throw new HttpException('Something went wrong while saving intensity data', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return {
      success: true,
      message: "Intensity saved successfully!!"
    }
  }

  async getIntensityQuestions(@Req() request, companyId?: number, frameworkIds?: number[]) {
    if (!companyId) {
      const userId = request?.headers?.userid;
      companyId = await this.userService.getCompanyId(+userId);
    }

    if (!frameworkIds) {
      frameworkIds = await this.superAdminClientService.getFrameworkIds(companyId);
    }

    const reportingQuestions = new Set((await this.superAdminClientService.getReportingQuestions(companyId, frameworkIds)).map((rq) => rq.questionId));

    const queryParam = {
      companyId: companyId,
    };

    try {
      const response = await this.externalApiCallService.getReq(
        `${process.env.COMPANY_SERVER_API_URL}getIntensityQuestions`,
        queryParam,
        {},
      );

      const questions = response?.intensityQuestions;

      if (!questions || !Array.isArray(questions) || questions.length === 0) {
        throw new HttpException('No questions found', HttpStatus.NOT_FOUND);
      }

      for(const question of questions) {
        const intensityReportingQuestions = Array.isArray(question.reportingQuestions) ? question.reportingQuestions : [];
        question.reportingQuestions = intensityReportingQuestions.filter(questionId => reportingQuestions.has(Number(questionId.split(":")[0])));
      }

      return questions;
    } catch (error) {
      console.error('getIntensityQuestions error:', error);
      if (error.getStatus() === 404) {
        return [];
      }
      throw new HttpException('Failed to fetch intensity questions', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private async getIntensityMetrics(frameworkIds, financialYearId, intensityType) : Promise<IntensityMetricDto[]> {
    return await this.metricCalculatorFactory.getCalculator(intensityType).calculate(financialYearId, frameworkIds);
  }

  private async getIntensityReportingQuestionAnswers(intensityReportingQuestions, financialYearId, frameworkIds) {
    const reportingQuestionIds: number[] = Array.from(
      new Set(
        intensityReportingQuestions.map(intensityReportingQuestion => 
          Number(intensityReportingQuestion.split(":")[0])
        )
      )
    );

    let reportingQuestionAnswers;
    try {
      reportingQuestionAnswers = await this.reportingModuleDaoService.getReportingQuestionAnswers(reportingQuestionIds, financialYearId) as ReportingQuestionAnswerEntity[];
    } catch (error) {
      console.error(`getReportingQuestionAnswers error for questionIds=${reportingQuestionIds} and financialYearId=${financialYearId}:\n`, error);
      throw new HttpException('Error fetching reportingQuestionAnswers', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    if (frameworkIds.includes(1)) {
      return await this.getIntensityReportingQuestionAnswersForBrsr(intensityReportingQuestions, reportingQuestionAnswers);
    }
    else if (frameworkIds.includes(48)) {
      return await this.getIntensityReportingQuestionAnswersForManipal(intensityReportingQuestions, reportingQuestionAnswers);
    }

    throw new HttpException(`Unsupported Framework with ID(s): ${frameworkIds.join(', ')}`, HttpStatus.NOT_FOUND);
  }

  private async getIntensityReportingQuestionAnswersForBrsr(
    intensityReportingQuestions: string[], reportingQuestionAnswers: ReportingQuestionAnswerEntity[]) {

    const reportingQuestionAnswersMap = reportingQuestionAnswers.reduce((acc, answer) => {
      const questionId = Number(answer.questionId);
      if (!acc[questionId]) acc[questionId] = [];
      acc[questionId].push(answer);
      return acc;
    }, {} as Record<number, ReportingQuestionAnswerEntity[]>);

    const result: Record<string, any> = {};

    for (const intensityReportingQuestion of intensityReportingQuestions) {
      const [questionIdStr, columnStr] = intensityReportingQuestion.split(":");
      const questionId = Number(questionIdStr);
      const columnIndex = columnStr ? Number(columnStr) - 1 : undefined;

      const answers = reportingQuestionAnswersMap[questionId] || [];

      result[intensityReportingQuestion] = answers
        .reduce((acc, answer) => {
          try {
            const parsed = JSON.parse(answer.answer);
            if (Array.isArray(parsed) && columnIndex !== undefined && !isNaN(parsed[columnIndex])) {
              const value = parseFloat(parsed[columnIndex]);
              if (!isNaN(value)) {
                const key = `${answer.financialYearId}-${answer.sourceId}-${answer.subLocationId}-${answer.fromDate}-${answer.toDate}-${intensityReportingQuestion}`;
                acc[key] = {
                  intensityReportingQuestion: intensityReportingQuestion,
                  financialYearId: answer.financialYearId,
                  sourceId: answer.sourceId,
                  subLocationId: answer.subLocationId,
                  fromDate: answer.fromDate,
                  toDate: answer.toDate,
                  answer: value.toFixed(5),
                };
              }
            }
          } catch (_) {
            // Ignore JSON parse error
          }
          return acc;
        }, {});
    }

    return result;
  }

  private async getIntensityReportingQuestionAnswersForManipal(
    intensityReportingQuestions: string[], reportingQuestionAnswers: ReportingQuestionAnswerEntity[]) {
    
    const reportingQuestionAnswersMap = reportingQuestionAnswers.reduce((acc, answer) => {
      const questionId = Number(answer.questionId);
      if (!acc[questionId]) acc[questionId] = [];
      acc[questionId].push(answer);
      return acc;
    }, {} as Record<number, ReportingQuestionAnswerEntity[]>);

    const result: Record<string, any> = {};

    for (const intensityReportingQuestion of intensityReportingQuestions) {
      const questionId = Number(intensityReportingQuestion.split(":")[0]);
      const answers = reportingQuestionAnswersMap[questionId] || [];

      result[intensityReportingQuestion] = answers
        .reduce((acc, answer) => {
          try {
            const parsed = typeof answer.answer === 'string' ? JSON.parse(answer.answer) : answer.answer;
            const value = parseFloat(parsed?.readingValue);
            if (!isNaN(value)) {
              const key = `${answer.financialYearId}-${answer.sourceId}-${answer.subLocationId}-${answer.fromDate}-${answer.toDate}-${intensityReportingQuestion}`;
              acc[key] = {
                intensityReportingQuestion: intensityReportingQuestion,
                financialYearId: answer.financialYearId,
                sourceId: answer.sourceId,
                subLocationId: answer.subLocationId,
                fromDate: answer.fromDate,
                toDate: answer.toDate,
                answer: value.toFixed(5),
              };
            }
          } catch (_) {
            // Ignore JSON parse error
          }
          return acc;
        }, {}); // remove undefined entries
    }

    return result;
  }
}