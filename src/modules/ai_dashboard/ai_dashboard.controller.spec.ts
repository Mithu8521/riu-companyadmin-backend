import { Test, TestingModule } from '@nestjs/testing';
import { AiDashboardController } from './ai_dashboard.controller';
import { AiDashboardService } from './ai_dashboard.service';

describe('AiDashboardController', () => {
  let controller: AiDashboardController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiDashboardController],
      providers: [AiDashboardService],
    }).compile();

    controller = module.get<AiDashboardController>(AiDashboardController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
