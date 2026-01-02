import { IsNotEmpty, IsNumber, IsArray } from 'class-validator';

export class SaveReportingDueDateApproveDto {
  @IsNotEmpty()
  @IsArray()
  @IsNumber({}, { each: true })
  ids: number[];

  @IsNotEmpty()
  @IsNumber()
  increasedDays: number;
}
