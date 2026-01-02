export enum QuestionStatus {
	'ANSWERED' = 'ANSWERED',
	'ACCEPTED' = 'ACCEPTED',
	'REJECTED' = 'REJECTED',
}

export enum AnswerFrequency {
	'MONTHLY' = 'MONTHLY',
	'QUARTERLY' = 'QUARTERLY',
	'HALF_YEARLY' = 'HALF_YEARLY',
	'YEARLY' = 'YEARLY',
}

export enum GHGScope {
	SCOPE1 = 'SCOPE1',
	SCOPE2 = 'SCOPE2',
	SCOPE3 = 'SCOPE3',
}

export enum QuestionType {
	'qualitative' = 'qualitative',
	'yes_no' = 'yes_no',
	'quantitative' = 'quantitative',
	'quantitative_trends' = 'quantitative_trends',
	'tabular_question' = 'tabular_question',
}

export enum TargetAudience {
	'EMPLOYEES_PERMANENT' = 'EMPLOYEES_PERMANENT',
	'EMPLOYEES_TEMPORARY' = 'EMPLOYEES_TEMPORARY',
	'WORKERS_PERMANENT' = 'WORKERS_PERMANENT',
	'WORKERS_TEMPORARY' = 'WORKERS_TEMPORARY',
	'KMP' = 'KMP',
	'BOD' = 'BOD',
	'CUSTOMERS' = 'CUSTOMERS',
	'SUPPLIERS' = 'SUPPLIERS',
	'DISTRIBUTORS' = 'DISTRIBUTORS'
}

export enum ModeOfTraining {
	'OFFLINE' = 'OFFLINE',
	'ONLINE' = 'ONLINE',
}

export enum UserType {
	'TRAINEE' = 'TRAINEE',
}

export enum TrainingStatus {
	'ATTENDANT' = 'ATTENDANT',
	'NON_ATTENDANT' = 'NON_ATTENDANT',
}


export enum InvitationTrainingStatus {
	'ACCEPTED' = 'ACCEPTED',
	'REJECTED' = 'REJECTED',
}

export enum Gender {
	'MALE' = 'MALE',
	'FEMALE' = 'FEMALE',
	'OTHER' = 'OTHER',
}



export enum QuestionnaireType {
	'CA' = 'CA',
	'SA' = 'SA',
}

export enum ModuleType {
	'SQ' = 'SQ',
	'AQ' = 'AQ',
}

export enum PlateformType {
	"supplier" = "supplier",
	"company" = "company"
}

export enum PlateformAdminType {
	"COMPANY_ADMIN'" = "COMPANY_ADMIN'",
	"SUPER_ADMIN" = "SUPER_ADMIN"
}

export enum IsDependent {
	"YES" = "YES",
	"NO" = "NO"
}

export enum GraphApplicable {
	"YES" = "YES",
	"NO" = "NO"
}

export const DATABASE_OPTIONS = {
	DEFRA: 1,
	IPCC: 2
} as const;

export const DATABASE_NAMES = {
	[DATABASE_OPTIONS.DEFRA]: 'DEFRA Database',
	[DATABASE_OPTIONS.IPCC]: 'IPCC Database'
} as const;

export enum QuestionFrequencyType {
	ONE_TIME = 'oneTime',
	EVERY_YEAR = 'everyYear',
	CUSTOM = 'custom'
}

export enum DueDateType {
	SELECT_DATE = 'selectDate',
	APPLY_RULE = 'applyRule'
}

export enum DueDateRule {
	AFTER = 'after',
	BEFORE = 'before'
}

export enum NotificationFrequency {
	ONCE = 'once',
	HOURLY = 'hourly',
	DAILY = 'daily',
	WEEKLY = 'weekly',
	MONTHLY = 'monthly'
}


export enum EmailNotificationsStatus {
	ACTIVE = 'active',
	INACTIVE = 'inactive',
	PENDING = 'pending',
	SENT = 'sent',
	FAILED = 'failed'
}

export enum ReportingApprovalStatus {
	PENDING = "PENDING",
	APPROVED = "APPROVED",
}


export enum NotificationsTypeEnum {
	SUSTAINABILITY_INSIGHTS = 'sustainabilityInsights',
	DATA_OWNER = 'dataOwner',
	AUDITOR = 'auditor',
	ADMIN = 'admin',
	DATA_OWNER_APPRECIATION = 'dataOwnerAppreciation',
	AUDITOR_APPRECIATION = 'auditorAppreciation'
}

export enum GraphCategoryTypeEnum {
  ENVIRONMENT = 'Environment',
  ENERGY = 'Energy',
  EMISSION = 'Emission',
  WATER = 'Water',
  WASTE = 'Waste',
  INTENSITY = 'Intensity',
  DIVERSITY = 'Diversity',
  EMPLOYMENT = 'Employment',
  OCCUPANCY = 'Occupancy',
  HEALTH_SAFETY = 'Health & Safety',
  TRAINING = 'Training',
}
