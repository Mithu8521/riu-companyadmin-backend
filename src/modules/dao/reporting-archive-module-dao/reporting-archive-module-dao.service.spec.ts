import { Test, TestingModule } from '@nestjs/testing';
import { ReportingArchiveModuleDaoService } from './reporting-archive-module-dao.service';

describe('ReportingArchiveModuleDaoService', () => {
  let service: ReportingArchiveModuleDaoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReportingArchiveModuleDaoService],
    }).compile();

    service = module.get<ReportingArchiveModuleDaoService>(ReportingArchiveModuleDaoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
