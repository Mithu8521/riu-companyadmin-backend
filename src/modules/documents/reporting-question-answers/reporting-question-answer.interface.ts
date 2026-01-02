import { ReportingQuestionAnswerDTO } from "../dto/reporting-question-answer.dto";

export interface ReportingQuestionAnswer {
  save(req: any, reportingQuestionAnswerDTO: ReportingQuestionAnswerDTO, reportingQuestion: any): Promise<any>;

  remove(req: any, reportingQuestionAnswerDTO: ReportingQuestionAnswerDTO, reportingQuestion: any): Promise<any>;
}