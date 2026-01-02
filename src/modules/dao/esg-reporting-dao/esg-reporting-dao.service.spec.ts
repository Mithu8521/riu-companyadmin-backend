import { Test, TestingModule } from '@nestjs/testing';
import { EsgReportingDaoService } from './esg-reporting-dao.service';

describe('EsgReportingDaoService', () => {
  let service: EsgReportingDaoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EsgReportingDaoService],
    }).compile();

    service = module.get<EsgReportingDaoService>(EsgReportingDaoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
