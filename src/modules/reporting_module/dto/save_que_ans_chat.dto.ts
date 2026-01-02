import {
  IsInt,
  IsOptional,
  IsString,
  IsNotEmpty,
  ValidateNested,
  IsBoolean,
  IsArray,
  IsDateString,
  ArrayUnique,
} from 'class-validator';
import { Type } from 'class-transformer';

class MentionsDto {

  @IsBoolean()
  isAll: boolean;

  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  userIds: number[];
}

export class SaveAnswerChatMessageDto {

  @IsInt()
  questionId: number;

  @IsInt()
  financialYearId: number;

  @IsOptional()
  @IsInt()
  sourceId?: number;

  @IsOptional()
  @IsInt()
  subLocationId?: number;

  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  toDate?: string;

  @IsInt()
  senderId: number;

  @IsString()
  @IsNotEmpty()
  senderName: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @ValidateNested()
  @Type(() => MentionsDto)
  mentions: MentionsDto;
}
