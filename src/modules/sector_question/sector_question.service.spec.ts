import { Test, TestingModule } from '@nestjs/testing';
import { SectorQuestionService } from './sector_question.service';

describe('SectorQuestionService', () => {
  let service: SectorQuestionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SectorQuestionService],
    }).compile();

    service = module.get<SectorQuestionService>(SectorQuestionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
