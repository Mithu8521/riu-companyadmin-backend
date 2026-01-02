import { Test, TestingModule } from '@nestjs/testing';
import { CarbanEmissionService } from './carban_emission.service';

describe('CarbanEmissionService', () => {
  let service: CarbanEmissionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CarbanEmissionService],
    }).compile();

    service = module.get<CarbanEmissionService>(CarbanEmissionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
