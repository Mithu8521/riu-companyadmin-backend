import { Test, TestingModule } from '@nestjs/testing';
import { SetTargetDataQuestionService } from './set_target_data_question.service';

describe('SetTargetDataQuestionService', () => {
  let service: SetTargetDataQuestionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SetTargetDataQuestionService],
    }).compile();

    service = module.get<SetTargetDataQuestionService>(SetTargetDataQuestionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
