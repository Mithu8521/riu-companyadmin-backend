import { Test, TestingModule } from '@nestjs/testing';
import { AnswerFrequencyService } from './answer-frequency-dao.service';

describe('AnswerFrequencyService', () => {
  let service: AnswerFrequencyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AnswerFrequencyService],
    }).compile();

    service = module.get<AnswerFrequencyService>(AnswerFrequencyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
