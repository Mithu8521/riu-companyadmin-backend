import { Test, TestingModule } from '@nestjs/testing';
import { IntensityDaoService } from './intensity-dao.service';

describe('IntensityDaoService', () => {
  let service: IntensityDaoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IntensityDaoService],
    }).compile();

    service = module.get<IntensityDaoService>(IntensityDaoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
