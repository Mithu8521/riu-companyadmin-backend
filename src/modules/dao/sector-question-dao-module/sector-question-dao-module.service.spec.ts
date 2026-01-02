import { Test, TestingModule } from '@nestjs/testing';
import { SectorQuestionDaoModuleService } from './sector-question-dao-module.service';

describe('SectorQuestionDaoModuleService', () => {
  let service: SectorQuestionDaoModuleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SectorQuestionDaoModuleService],
    }).compile();

    service = module.get<SectorQuestionDaoModuleService>(SectorQuestionDaoModuleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
