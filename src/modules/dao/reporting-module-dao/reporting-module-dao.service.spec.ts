import { Test, TestingModule } from '@nestjs/testing';
import { ReportingModuleDaoService } from './reporting-module-dao.service';

describe('ReportingModuleDaoService', () => {
  let service: ReportingModuleDaoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReportingModuleDaoService],
    }).compile();

    service = module.get<ReportingModuleDaoService>(ReportingModuleDaoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
