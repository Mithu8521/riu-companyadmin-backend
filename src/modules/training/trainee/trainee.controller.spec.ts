import { Test, TestingModule } from '@nestjs/testing';
import { TraineeController } from './trainee.controller';
import { TraineeService } from './trainee.service';

describe('TraineeController', () => {
  let controller: TraineeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TraineeController],
      providers: [TraineeService],
    }).compile();

    controller = module.get<TraineeController>(TraineeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
