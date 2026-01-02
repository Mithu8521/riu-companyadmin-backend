import { Injectable } from '@nestjs/common';
import { ReportingModuleDaoService } from '../dao/reporting-module-dao/reporting-module-dao.service';
import { ReportingQuestionAnswerEntity } from './entities/reporting_question_answer.entity';


@Injectable()
export class MigrateManipalTabularToTrendsService {
  constructor(
    private readonly reportingModuleDaoService: ReportingModuleDaoService

  ) {}

  formatValue(data) {
    if (Array.isArray(data)) {
      return data
        .map((item) => {
          if (Array.isArray(item)) {
            return this.formatValue(item);
          } else if (item === null || item === undefined || item === "") {
            return "";
          } else {
            return item.trim();
          }
        })
        .join("\n");
    } else if (data && typeof data === "object") {
      if (data.hasOwnProperty("readingValue")) {
        const value =
          typeof data.readingValue === "string"
            ? data.readingValue.replace(/,/g, "")
            : String(data.readingValue).replace(/,/g, "");
        return value;
      }
    } else if (typeof data === "string") {
      return data.trim();
    }

    return '';
  };

  async updateAnswers(answers) {
    for(const ans of answers) {
      if (ans.answer) {

        const parsedAnswer = JSON.parse(ans.answer)
        let cleanedValue = this.formatValue(parsedAnswer);

        let value = cleanedValue
            .split('\n')
            .reverse()
            .map(v => v.trim())
            .find(v => v !== '' && !isNaN(Number(v)));

        if (!value) {
          value = cleanedValue
            .split('\n')
            .reverse()
            .map(v => v.trim())
            .find(v => v !== '');
        }

        ans.answer = JSON.stringify({
          questionId: ans.questionId,
          moduleId: ans.moduleId,
          questionType: "quantitative_trends",
          questionTitle: ans.title,
          fromDate: ans.fromDate,
          toDate: ans.toDate,
          frequency: ans.frequency,
          readingValue: value ?? '',
          unit: ans.questionId === 402 ? 'Kg' : '%',
        });
      }

      ans.questionType = "quantitative_trends";

      await this.reportingModuleDaoService.saveReportingQuestionAnswer(ans as ReportingQuestionAnswerEntity);
    }
  }

  async run() {
    let answersToUpdate = await this.reportingModuleDaoService.getReportingQuestionAnswers([402, 437, 501, 502, 503, 504, 531], 31);
    await this.updateAnswers(answersToUpdate);
    answersToUpdate = await this.reportingModuleDaoService.getReportingQuestionAnswers([402, 437, 501, 502, 503, 504, 531], 30);
    await this.updateAnswers(answersToUpdate);
    answersToUpdate = await this.reportingModuleDaoService.getReportingQuestionAnswers([402, 437, 501, 502, 503, 504, 531], 6);
    await this.updateAnswers(answersToUpdate);
  }
}
