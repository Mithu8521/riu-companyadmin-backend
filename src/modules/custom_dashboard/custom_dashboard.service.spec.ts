import { Test, TestingModule } from '@nestjs/testing';
import { CustomDashboardService } from './custom_dashboard.service';

describe('CustomDashboardService', () => {
  let service: CustomDashboardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CustomDashboardService],
    }).compile();

    service = module.get<CustomDashboardService>(CustomDashboardService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
