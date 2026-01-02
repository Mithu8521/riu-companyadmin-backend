import { Test, TestingModule } from '@nestjs/testing';
import { CarbonEmissionDaoService } from './carbon_emission-dao.service';

describe('CarbonEmissionDaoService', () => {
  let service: CarbonEmissionDaoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CarbonEmissionDaoService],
    }).compile();

    service = module.get<CarbonEmissionDaoService>(CarbonEmissionDaoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
