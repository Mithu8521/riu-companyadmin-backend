import { Test, TestingModule } from '@nestjs/testing';
import { FrequencyController } from './frequency.controller';
import { FrequencyService } from './frequency.service';

describe('FrequencyController', () => {
  let controller: FrequencyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FrequencyController],
      providers: [FrequencyService],
    }).compile();

    controller = module.get<FrequencyController>(FrequencyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
