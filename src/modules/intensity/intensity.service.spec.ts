import { Test, TestingModule } from '@nestjs/testing';
import { IntensityService } from './intensity.service';

describe('IntensityService', () => {
  let service: IntensityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IntensityService],
    }).compile();

    service = module.get<IntensityService>(IntensityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
