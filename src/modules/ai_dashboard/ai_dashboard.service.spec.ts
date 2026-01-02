import { Test, TestingModule } from '@nestjs/testing';
import { AiDashboardService } from './ai_dashboard.service';

describe('AiDashboardService', () => {
  let service: AiDashboardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AiDashboardService],
    }).compile();

    service = module.get<AiDashboardService>(AiDashboardService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
