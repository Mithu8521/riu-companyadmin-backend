import { Test, TestingModule } from '@nestjs/testing';
import { ReportingModuleService } from './reporting_module.service';

describe('ReportingModuleService', () => {
  let service: ReportingModuleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReportingModuleService],
    }).compile();

    service = module.get<ReportingModuleService>(ReportingModuleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
