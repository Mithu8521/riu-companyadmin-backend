import { Test, TestingModule } from '@nestjs/testing';
import { ReportingModuleController } from './reporting_module.controller';
import { ReportingModuleService } from './reporting_module.service';

describe('ReportingModuleController', () => {
  let controller: ReportingModuleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportingModuleController],
      providers: [ReportingModuleService],
    }).compile();

    controller = module.get<ReportingModuleController>(ReportingModuleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
