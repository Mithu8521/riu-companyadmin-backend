import { NestFactory } from '@nestjs/core';
import { AppModule } from '@app/app.module';
import { SectorDocumentsMigrationService } from '@app/modules/documents/sector-documents-migration.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const migrationService = app.get(SectorDocumentsMigrationService);

  await migrationService.run();

  console.log('Migration done');

  await app.close();
}

bootstrap();
