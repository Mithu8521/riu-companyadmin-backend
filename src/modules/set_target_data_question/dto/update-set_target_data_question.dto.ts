import { PartialType } from '@nestjs/mapped-types';
import { CreateSetTargetDataQuestionDto } from './create-set_target_data_question.dto';

export class UpdateSetTargetDataQuestionDto extends PartialType(CreateSetTargetDataQuestionDto) {}
