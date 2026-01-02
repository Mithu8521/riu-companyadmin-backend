import { IsNotEmpty, IsString, IsNumber, ValidateNested, IsArray, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

class TrendDto {
  @IsNotEmpty()
  @IsString()
  from_date: string;

  @IsNotEmpty()
  @IsString()
  to_date: string;

  @IsNotEmpty()
  @IsNumber()
  meter_id: number;

  @IsNotEmpty()
  @IsString()
  process: string;

  @IsNotEmpty()
  @IsString()
  reading_value: string;

  @IsOptional()
  @IsString()
  note?: string;
}

class QuestionDataDto {
  @IsNotEmpty()
  @IsNumber()
  frameworkId: number;

  @IsNumber()
  topicId: number;

  @IsNumber()
  kpiId: number;

  @IsNotEmpty()
  @IsNumber()
  questionId: number;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  from_date?: string;

  @IsNotEmpty()
  @IsString()
  to_date?: string;

  @IsNotEmpty()
  @IsNumber()
  meter_id?: number;

  @IsNotEmpty()
  @IsString()
  questionType: 'qualitative' | 'yes_no' | 'quantitative' | 'tabular_question' | 'quantitative_trends';

  @IsNotEmpty()
  @IsNumber()
  answer_id: number;

  source_id?: number;

  notApplicable?:string;

  performed?:boolean;

  @IsNotEmpty()
  @IsArray({ message: 'The answer array must not be empty' })
  @Transform(({ value, obj }) => {
    if (Array.isArray(value) && value.length > 0) {
      return value.map((element) => (typeof element === 'number' ? element : String(element)));
    }
    return value;
  })
  answer: string | number | (string | number)[];

  @IsOptional()
  @ValidateNested({ each: true })
  @IsArray()
  @Transform(({ value, obj }) => {
    if (Array.isArray(value) && value.length > 0) {
      return value.map((element) => {
        if (typeof element === 'object' && element !== null) {
          return Object.assign(new TrendDto(), element);
        }
        return element;
      });
    }
    return value;
  })
  quantitative_trends?: TrendDto[];
}

export class SaveAnswerQuestionDto {
  @IsNotEmpty()
  @IsNumber()
  financialYearId: number;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  data: QuestionDataDto[];
}
