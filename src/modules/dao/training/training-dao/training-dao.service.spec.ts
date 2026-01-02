import { Test, TestingModule } from '@nestjs/testing';
import { TrainingDaoService } from './training-dao.service';

describe('TrainingDaoService', () => {
  let service: TrainingDaoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TrainingDaoService],
    }).compile();

    service = module.get<TrainingDaoService>(TrainingDaoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
