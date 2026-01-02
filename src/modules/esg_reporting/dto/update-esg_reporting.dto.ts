import { PartialType } from '@nestjs/mapped-types';
import { CreateEsgReportingDto } from './create-esg_reporting.dto';

export class UpdateEsgReportingDto extends PartialType(CreateEsgReportingDto) {}
