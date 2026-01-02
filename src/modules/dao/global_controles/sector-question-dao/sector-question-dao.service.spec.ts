import { Test, TestingModule } from '@nestjs/testing';
import { SectorQuestionDaoService } from './sector-question-dao.service';

describe('SectorQuestionDaoService', () => {
  let service: SectorQuestionDaoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SectorQuestionDaoService],
    }).compile();

    service = module.get<SectorQuestionDaoService>(SectorQuestionDaoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
