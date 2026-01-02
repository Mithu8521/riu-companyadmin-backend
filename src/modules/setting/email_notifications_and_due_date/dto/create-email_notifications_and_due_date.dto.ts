import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsArray, IsBoolean, IsOptional, IsEnum, ValidateNested, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';

class DueDateConfigurationDto {
  @ApiProperty({ enum: ['selectDate', 'applyRule'] })
  @IsEnum(['selectDate', 'applyRule'])
  type: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  fixedDate?: string;

  @ApiProperty({ enum: ['after', 'before'], required: false })
  @IsOptional()
  @IsEnum(['after', 'before'])
  rule?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  days?: number;
}

class NotificationsDto {
  @ApiProperty()
  @IsNumber()
  daysBeforeDueDate: number;

  @ApiProperty({ enum: ['once', 'hourly', 'daily', 'weekly', 'monthly'] })
  @IsEnum(['once', 'hourly', 'daily', 'weekly', 'monthly'])
  frequency: string;

  @ApiProperty({ enum: ['dataOwner', 'auditor', 'admin', 'sustainabilityInsights', 'dataOwnerAppreciation', 'auditorAppreciation'] })
  @IsEnum(['dataOwner', 'auditor', 'admin', 'sustainabilityInsights', 'dataOwnerAppreciation', 'auditorAppreciation'])
  notificationType: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  fixedTime?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  fromTime?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  toTime?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  selectedDay?: string;
}

class NotificationByTypeDto {
  @ApiProperty({ type: [NotificationsDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NotificationsDto)
  dataOwner?: NotificationsDto[];

  @ApiProperty({ type: [NotificationsDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NotificationsDto)
  auditor?: NotificationsDto[];

  @ApiProperty({ type: [NotificationsDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NotificationsDto)
  admin?: NotificationsDto[];

  @ApiProperty({ type: [NotificationsDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NotificationsDto)
  appreciation?: NotificationsDto[];
}

export class CreateEmailNotificationAndDueDateDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  financialYear: number;

  @ApiProperty({ enum: ['oneTime', 'everyYear', 'custom'] })
  @IsEnum(['oneTime', 'everyYear', 'custom'])
  questionType: string;

  @ApiProperty({ type: DueDateConfigurationDto, required: false, nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)  // 👈 skip validation if null
  @ValidateNested()
  @Type(() => DueDateConfigurationDto)
  dueDateConfiguration?: DueDateConfigurationDto | null;

  @ApiProperty({ type: NotificationByTypeDto })
  @ValidateNested()
  @Type(() => NotificationByTypeDto)
  notificationsByType: NotificationByTypeDto;
}