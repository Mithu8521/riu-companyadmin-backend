import { Injectable } from '@nestjs/common';
import { QualitativeReportingQuestionAnswer } from './qualitative-reporting-question-answer';
import { QuantitativeReportingQuestionAnswer } from './quantitative-reporting-question-answer';
import { QuantitativeTrendsReportingQuestionAnswer } from './quantitative-trends-reporting-question-answer';
import { YesNoReportingQuestionAnswer } from './yes-no-reporting-question-answer';
import { TabularReportingQuestionAnswer } from './tabular-reporting-question-answer';
import { ReportingQuestionAnswer } from './reporting-question-answer.interface';


@Injectable()
export class ReportingQuestionAnswerFactory {
  private readonly reportingQuestionAnswers: Record<string, ReportingQuestionAnswer>;

  constructor(
    private qualitativeReportingQuestionAnswer : QualitativeReportingQuestionAnswer,
    private quantitativeReportingQuestionAnswer : QuantitativeReportingQuestionAnswer,
    private quantitativeTrendsReportingQuestionAnswer : QuantitativeTrendsReportingQuestionAnswer,
    private yesNoReportingQuestionAnswer : YesNoReportingQuestionAnswer,
    private tabularReportingQuestionAnswer : TabularReportingQuestionAnswer,
  ) {
    this.reportingQuestionAnswers = {
      ['qualitative']: this.qualitativeReportingQuestionAnswer,
      ['quantitative']: this.quantitativeReportingQuestionAnswer,
      ['quantitative_trends']: this.quantitativeTrendsReportingQuestionAnswer,
      ['yes_no']: this.yesNoReportingQuestionAnswer,
      ['tabular_question']: this.tabularReportingQuestionAnswer,
    };
  }

  getReportingQuestionAnswer(questionType: any): ReportingQuestionAnswer {
    const reportingQuestionAnswer = this.reportingQuestionAnswers[questionType];
    if (!reportingQuestionAnswer) {
      console.log(questionType);
      throw new Error(`Unsupported question type: ${questionType}`);
    }
    return reportingQuestionAnswer;
  }
}
