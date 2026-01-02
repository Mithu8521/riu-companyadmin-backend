import { ConfigService } from "./config.service";

export default (config: ConfigService) => ({
	project: {
		name: config.get("packageName"),
		version: config.get("packageVersion"),
		description: config.get("packageDescription"),
		author: config.get("packageAuthor")
	},
	server: {
		isProd: config.isEnv("prod"),
		port: parseInt(`${config.get("PORT")}`, 10),
		context: config.get("CONTEXT") || "v1.0",
		origins: config.get("ORIGINS") ? `${config.get("ORIGINS")}`.split(",") : "*",
		allowedHeaders: config.get("ALLOWED_HEADERS"),
		allowedMethods: config.get("ALLOWED_METHODS"),
		corsEnabled: config.get("CORS_ENABLED"), // it should be boolean
		corsCredentials: config.get("CORS_CREDENTIALS") // it should be boolean
	},
	swagger: {
		path: config.get("SWAGGER_PATH") || "docs",
		enabled: config.get("SWAGGER_ENABLED") // it should be boolean
	}
});
