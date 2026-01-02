import { Test, TestingModule } from '@nestjs/testing';
import { CustomDashboardController } from './custom_dashboard.controller';
import { CustomDashboardService } from './custom_dashboard.service';

describe('CustomDashboardController', () => {
  let controller: CustomDashboardController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomDashboardController],
      providers: [CustomDashboardService],
    }).compile();

    controller = module.get<CustomDashboardController>(CustomDashboardController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
