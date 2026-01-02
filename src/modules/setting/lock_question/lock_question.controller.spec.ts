import { Test, TestingModule } from '@nestjs/testing';
import { LockQuestionController } from './lock_question.controller';
import { LockQuestionService } from './lock_question.service';

describe('LockQuestionController', () => {
  let controller: LockQuestionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LockQuestionController],
      providers: [LockQuestionService],
    }).compile();

    controller = module.get<LockQuestionController>(LockQuestionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
