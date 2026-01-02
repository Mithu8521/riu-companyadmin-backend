import { Test, TestingModule } from '@nestjs/testing';
import { KpiDaoService } from './kpi-dao.service';

describe('KpiDaoService', () => {
  let service: KpiDaoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [KpiDaoService],
    }).compile();

    service = module.get<KpiDaoService>(KpiDaoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
