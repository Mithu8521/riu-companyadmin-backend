import { Test, TestingModule } from '@nestjs/testing';
import { LockQuestionDaoService } from './lock_question-dao.service';

describe('LockQuestionDaoService', () => {
  let service: LockQuestionDaoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LockQuestionDaoService],
    }).compile();

    service = module.get<LockQuestionDaoService>(LockQuestionDaoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
