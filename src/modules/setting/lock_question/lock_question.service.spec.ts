import { Test, TestingModule } from '@nestjs/testing';
import { LockQuestionService } from './lock_question.service';

describe('LockQuestionService', () => {
  let service: LockQuestionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LockQuestionService],
    }).compile();

    service = module.get<LockQuestionService>(LockQuestionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
