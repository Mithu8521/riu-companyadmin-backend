import { NestFactory } from '@nestjs/core';
import { AppModule } from '@app/app.module';
import { MigrateManipalTabularToTrendsService } from '@app/modules/reporting_module/migrate-manipal-tabular-to-trends';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const migrationService = app.get(MigrateManipalTabularToTrendsService);

  await migrationService.run();

  console.log('Migration done');

  await app.close();
}

bootstrap();
