import { Test, TestingModule } from '@nestjs/testing';
import { EmissionController } from './emission.controller';
import { EmissionService } from './emission.service';

describe('EmissionController', () => {
  let controller: EmissionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmissionController],
      providers: [EmissionService],
    }).compile();

    controller = module.get<EmissionController>(EmissionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
