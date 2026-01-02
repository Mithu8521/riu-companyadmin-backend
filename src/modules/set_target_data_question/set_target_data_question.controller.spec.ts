import { Test, TestingModule } from '@nestjs/testing';
import { SetTargetDataQuestionController } from './set_target_data_question.controller';
import { SetTargetDataQuestionService } from './set_target_data_question.service';

describe('SetTargetDataQuestionController', () => {
  let controller: SetTargetDataQuestionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SetTargetDataQuestionController],
      providers: [SetTargetDataQuestionService],
    }).compile();

    controller = module.get<SetTargetDataQuestionController>(SetTargetDataQuestionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
