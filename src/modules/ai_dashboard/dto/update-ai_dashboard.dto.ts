import { PartialType } from '@nestjs/mapped-types';
import { CreateAiDashboardDto } from './create-ai_dashboard.dto';

export class UpdateAiDashboardDto extends PartialType(CreateAiDashboardDto) {}
