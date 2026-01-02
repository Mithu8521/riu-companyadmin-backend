import { Test, TestingModule } from '@nestjs/testing';
import { PuppeteerChartService } from './puppeteer-chart.service';

describe('PuppeteerChartService', () => {
  let service: PuppeteerChartService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PuppeteerChartService],
    }).compile();

    service = module.get<PuppeteerChartService>(PuppeteerChartService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
