import { Test, TestingModule } from '@nestjs/testing';
import { ReportingArchiveModuleController } from './reporting_archive_module.controller';
import { ReportingArchiveModuleService } from './reporting_archive_module.service';

describe('ReportingArchiveModuleController', () => {
  let controller: ReportingArchiveModuleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportingArchiveModuleController],
      providers: [ReportingArchiveModuleService],
    }).compile();

    controller = module.get<ReportingArchiveModuleController>(ReportingArchiveModuleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
