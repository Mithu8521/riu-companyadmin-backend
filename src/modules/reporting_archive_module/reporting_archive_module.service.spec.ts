import { Test, TestingModule } from '@nestjs/testing';
import { ReportingArchiveModuleService } from './reporting_archive_module.service';

describe('ReportingArchiveModuleService', () => {
  let service: ReportingArchiveModuleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReportingArchiveModuleService],
    }).compile();

    service = module.get<ReportingArchiveModuleService>(ReportingArchiveModuleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
