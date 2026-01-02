import { Test, TestingModule } from '@nestjs/testing';
import { IntensityController } from './intensity.controller';
import { IntensityService } from './intensity.service';

describe('IntensityController', () => {
  let controller: IntensityController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IntensityController],
      providers: [IntensityService],
    }).compile();

    controller = module.get<IntensityController>(IntensityController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
