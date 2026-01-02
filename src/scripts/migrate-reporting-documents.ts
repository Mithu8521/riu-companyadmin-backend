import { NestFactory } from '@nestjs/core';
import { AppModule } from '@app/app.module';
import { ReportingDocumentsMigrationService } from '@app/modules/documents/reporting-documents-migration.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const migrationService = app.get(ReportingDocumentsMigrationService);

  await migrationService.run();

  console.log('Migration done');

  await app.close();
}

bootstrap();
