import { Test, TestingModule } from '@nestjs/testing';
import { EsgReportingController } from './esg_reporting.controller';
import { EsgReportingService } from './esg_reporting.service';

describe('EsgReportingController', () => {
  let controller: EsgReportingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EsgReportingController],
      providers: [EsgReportingService],
    }).compile();

    controller = module.get<EsgReportingController>(EsgReportingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
