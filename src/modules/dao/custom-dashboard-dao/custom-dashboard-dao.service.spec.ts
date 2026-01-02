import { Test, TestingModule } from '@nestjs/testing';
import { CustomDashboardDaoService } from './custom-dashboard-dao.service';

describe('CustomDashboardDaoService', () => {
  let service: CustomDashboardDaoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CustomDashboardDaoService],
    }).compile();

    service = module.get<CustomDashboardDaoService>(CustomDashboardDaoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
