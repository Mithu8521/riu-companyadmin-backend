import * as joi from 'joi';

export type ENV_TYPE = 'local' | 'test' | 'dev' | 'prod' | 'uat' | 'qa';

export interface PACKAGE_CONFIG {
  packageAuthor: string;
  packageName: string;
  packageVersion: string;
  packageDescription: string;
}

export interface ENV_CONFIG extends PACKAGE_CONFIG {
  ENV: string;
  PORT: number;
  CONTEXT: string;
  ORIGINS: string;
  ALLOWED_HEADERS: string;
  ALLOWED_METHODS: string;
  CORS_ENABLED: boolean;
  CORS_CREDENTIALS: boolean;

  WRITE_LOG: boolean;
  MINIMUM_LOG_LEVEL: string;

  SWAGGER_PATH: string;
  SWAGGER_ENABLED: boolean;

  TEST_KEY: string;

  DB_TYPE: string;
  DB_HOST: string;
  DB_PORT: number;
  DB_USERNAME: string;
  DB_PASSWORD: string;
  DB_DATABASE: string;

  PG_HOST: string;
  PG_PORT: number;
  PG_USERNAME: string;
  PG_PASSWORD: string;
  PG_DATABASE: string;

   // MQTT
  MQTT_URL: string;
  MQTT_USERNAME: string;
  MQTT_PASSWORD: string;
  MQTT_TOPIC: string;

  HCAPTCHA_SECRET_KEY: string;
  BASE_URL_BACKEND: string;
  OPENAI_API_KEY: string;
  ANTHROPIC_API_KEY: string;
  BASE_URL1: string;
  BASE_URL2: string;
  BASE_URL3: string;
  BASE_URL4: string;
  BASE_URL5: string;
  BASE_URL6: string;
  BACKEND_URL: string;
  BRSR_FRAMEWORK_ID: string;
  BASE_URL: string;
  COMPANY_SERVER_API_URL: string;
  SCRIPT_RUNNER_SERVICE_API_URL: string,
  AUTH_API_URL: string;
  PLATEFORM_NAME: string;
  FILE_UPLOAD_URL: string;
  excludedDomains: any;
  BASE_URL_SUPPLIER_INVITE: string;
  RAZORPAY_KEY_ID: string;
  RAZORPAY_KEY_SECRET: string;
}

export const envSchema: joi.ObjectSchema<ENV_CONFIG> = joi.object({
  ENV: joi.string().required().default('dev'),
  PORT: joi.number(),
  CONTEXT: joi.string().empty('').default(`v1.0`),
  ORIGINS: joi.string().default('*'),
  ALLOWED_HEADERS: joi.string(),
  ALLOWED_METHODS: joi.string(),
  CORS_ENABLED: joi.boolean(),
  CORS_CREDENTIALS: joi.boolean(),

  WRITE_LOG: joi.boolean(),
  MINIMUM_LOG_LEVEL: joi.string(),

  SWAGGER_PATH: joi.string(),
  SWAGGER_ENABLED: joi.boolean(),

  TEST_KEY: joi.string(),

  DB_TYPE: joi.string(),
  DB_HOST: joi.string(),
  DB_PORT: joi.number(),
  DB_USERNAME: joi.string(),
  DB_PASSWORD: joi.string(),
  DB_DATABASE: joi.string(),

  MQTT_URL: joi.string(),
  MQTT_USERNAME: joi.string(),
  MQTT_PASSWORD: joi.string(),
  MQTT_TOPIC: joi.string(),

  PG_HOST: joi.string(),
  PG_PORT: joi.number(),
  PG_USERNAME: joi.string(),
  PG_PASSWORD: joi.string(),
  PG_DATABASE: joi.string(),

  HCAPTCHA_SECRET_KEY: joi.string(),
  OPENAI_API_KEY: joi.string(),
  ANTHROPIC_API_KEY: joi.string(),
  BASE_URL_BACKEND: joi.string(),
  BASE_URL1: joi.string(),
  BASE_URL2: joi.string(),
  BASE_URL3: joi.string(),
  BASE_URL4: joi.string(),
  BASE_URL5: joi.string(),
  BASE_URL6: joi.string(),
  BACKEND_URL: joi.string(),
  BRSR_FRAMEWORK_ID: joi.string(),
  COMPANY_SERVER_API_URL: joi.string(),
  SCRIPT_RUNNER_SERVICE_API_URL: joi.string(),
  BASE_URL: joi.string(),
  AUTH_API_URL: joi.string(),
  PLATEFORM_NAME: joi.string(),
  excludedDomains: joi.any(),
  BASE_URL_SUPPLIER_INVITE: joi.string().empty(''),
  FILE_UPLOAD_URL: joi.string().empty(''),
  RAZORPAY_KEY_ID: joi.string().empty(''),
  RAZORPAY_KEY_SECRET: joi.string().empty(''),
});
