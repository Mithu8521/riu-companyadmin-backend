import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import * as compression from 'compression';
import { AppModule } from './app.module';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { ResponseInterceptor } from './utils/middlewares/response/response.interceptor';
import { ConfigService } from './config/config.service';
import initServerConfig from './config/configuration';

import { webcrypto } from "crypto";
(globalThis as any).crypto = webcrypto;


(async () => {
  const app = await NestFactory.create(AppModule);

  const configService: ConfigService = app.get<ConfigService>(ConfigService);
  const isProd: boolean = configService.isEnv('prod');
  const { server, project, swagger } = initServerConfig(configService);

  const logger: Logger = new Logger(`MAIN`);

  app.useLogger(
    isProd
      ? app.get(WINSTON_MODULE_NEST_PROVIDER)
      : ['debug', 'error', 'log', 'verbose', 'warn'],
  );
  const port = server.port;
  app.use([cookieParser(), compression()]);
  // app.useGlobalFilters(new CommonExceptionFilter(new AppLoggerService(configService)));
  // app.useGlobalInterceptors(new ResponseInterceptor());
  if (!!swagger.enabled) {
    const pubOptions = new DocumentBuilder()
      .setTitle(`${project.name}`)
      .setDescription(`Swagger: ${project.description}`)
      .setVersion(`${project.version}`)
      // .addBearerAuth()
      .addBearerAuth(
        {
          description: `Please enter token in following format: Bearer <JWT>`,
          name: 'Authorization',
          bearerFormat: 'Bearer',
          scheme: 'Bearer',
          type: 'http',
          in: 'Header',
        },
        'access-token',
      )
      .build();
    const document = SwaggerModule.createDocument(app, pubOptions);
    SwaggerModule.setup(`${server.context}/${swagger.path}`, app, document);
  }

  app.useGlobalPipes(new ValidationPipe());

  if (server.corsEnabled) {
    app.enableCors();
  }
  await app.listen(port, '0.0.0.0', async () => {
    logger.log(
      `📚 Swagger is running on: http://localhost:${port}/${server.context}/${swagger.path}`,
    );
    logger.log(
      `🚀 Application is running on: http://localhost:${port}/${server.context}`,
    );
  });
})();

process.on('unhandledRejection', (err: Error): void => {
  const logger = new Logger(`[MAIN] [unhandledRejection]`);
  logger.error(err.stack);
});
