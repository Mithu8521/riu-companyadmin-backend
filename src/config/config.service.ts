import { Logger } from "@nestjs/common";
import * as fs from "fs";
import { resolve } from "path";
import { parse } from "dotenv";
import { ConfigService as NestConfigService } from "@nestjs/config";
import { ENV_CONFIG, ENV_TYPE, PACKAGE_CONFIG, envSchema } from "./validation.types";
import * as PACKAGE_JSON from "../../package.json";

/**
 * Config Service
 */
export class ConfigService extends NestConfigService {
	/**
	 * Nest Logger
	 */
	private readonly Logger = new Logger(ConfigService.name);

	/**
	 * Object that will contain the injected environment variables
	 */
	private readonly envConfig: ENV_CONFIG;

	/**
	 * Constructor
	 * @param {string} filePath
	 */
	constructor(filePath: string) {
		super();
		console.log("FILEPATH: ", filePath);

		const _PATH = resolve(filePath);
		const config: any = parse(fs.readFileSync(_PATH));
		this.Logger.log(`Loading ENV ---> [${filePath}] : PATH: ${_PATH}\n\n`);
		const validatedConfig = ConfigService.validateInput(config);
		const packageConfig = this.initPackageConfig();

		this.envConfig = { ...packageConfig, ...validatedConfig };

		let configInStringType={};
		Object.keys(this.envConfig).map(config=>{
			configInStringType[config] = (this.envConfig[config]).toString()
		})

		process.env = {...(process.env), ...(configInStringType)}
	}

	/**
	 * Init Package Config
	 * @returns
	 */
	private initPackageConfig(): PACKAGE_CONFIG {
		const { author, name, version, description, ...others } = PACKAGE_JSON;
		return { packageAuthor: author, packageName: name, packageVersion: version, packageDescription: description };
	}

	/**
	 * Ensures all needed variables are set, and returns the validated JavaScript object
	 * including the applied default values.
	 * @param {EnvConfig} envConfig the configuration object with variables from the configuration file
	 * @returns {EnvConfig} a validated environment configuration object
	 */
	private static validateInput(envConfig: ENV_CONFIG): ENV_CONFIG {
		const { error, value: validatedEnvConfig } = envSchema.validate(envConfig);
		if (error) {
			throw new Error(`Config validation error: ${error.message}`);
		}
		return validatedEnvConfig;
	}

	/**
	 * Fetches the key from the configuration file
	 * @param {string} key
	 */
	public get(key: keyof ENV_CONFIG) {
		return this.envConfig[key];
	}

	/**
	 * Checks whether the application environment set in the configuration file matches the environment parameter
	 * @param env  as env: dev | prod, //TODO: if added more env, configure here as well !!
	 * @returns {boolean} Whether or not the environment variable matches the application environment
	 */
	public isEnv(env: ENV_TYPE): boolean {
		return this.envConfig.ENV === env;
	}
}
