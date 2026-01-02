import { Test, TestingModule } from '@nestjs/testing';
import { SectorQuestionController } from './sector_question.controller';
import { SectorQuestionService } from './sector_question.service';

describe('SectorQuestionController', () => {
  let controller: SectorQuestionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SectorQuestionController],
      providers: [SectorQuestionService],
    }).compile();

    controller = module.get<SectorQuestionController>(SectorQuestionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
