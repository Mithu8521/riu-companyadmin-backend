import { Test, TestingModule } from '@nestjs/testing';
import { SetTargetDataQuestionDaoService } from './set_target_data_question-dao.service';

describe('SetTargetDataQuestionDaoService', () => {
  let service: SetTargetDataQuestionDaoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SetTargetDataQuestionDaoService],
    }).compile();

    service = module.get<SetTargetDataQuestionDaoService>(SetTargetDataQuestionDaoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
