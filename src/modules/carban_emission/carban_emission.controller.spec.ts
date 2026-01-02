import { Test, TestingModule } from '@nestjs/testing';
import { CarbanEmissionController } from './carban_emission.controller';
import { CarbanEmissionService } from './carban_emission.service';

describe('CarbanEmissionController', () => {
  let controller: CarbanEmissionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CarbanEmissionController],
      providers: [CarbanEmissionService],
    }).compile();

    controller = module.get<CarbanEmissionController>(CarbanEmissionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
