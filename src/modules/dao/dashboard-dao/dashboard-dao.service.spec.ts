import { Test, TestingModule } from '@nestjs/testing';
import { DashboardDaoService } from './dashboard-dao.service';

describe('DashboardDaoService', () => {
  let service: DashboardDaoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DashboardDaoService],
    }).compile();

    service = module.get<DashboardDaoService>(DashboardDaoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
