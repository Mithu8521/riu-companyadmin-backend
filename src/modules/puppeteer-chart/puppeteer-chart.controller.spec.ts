import { Test, TestingModule } from '@nestjs/testing';
import { PuppeteerChartController } from './puppeteer-chart.controller';

describe('PuppeteerChartController', () => {
  let controller: PuppeteerChartController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PuppeteerChartController],
    }).compile();

    controller = module.get<PuppeteerChartController>(PuppeteerChartController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
