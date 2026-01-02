import { Module } from '@nestjs/common';
import { PuppeteerChartController } from './puppeteer-chart.controller';
import { PuppeteerChartService } from './puppeteer-chart.service';

@Module({
  providers: [PuppeteerChartService],
  controllers: [PuppeteerChartController],
  exports: [PuppeteerChartService]
})
export class PuppeteerChartModule {}
