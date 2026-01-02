import { Test, TestingModule } from '@nestjs/testing';
import { EsgReportingService } from './esg_reporting.service';

describe('EsgReportingService', () => {
  let service: EsgReportingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EsgReportingService],
    }).compile();

    service = module.get<EsgReportingService>(EsgReportingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
