import { Test, TestingModule } from '@nestjs/testing';
import { TriggerReminderController } from './trigger_reminder.controller';
import { TriggerReminderService } from './trigger_reminder.service';

describe('TriggerReminderController', () => {
  let controller: TriggerReminderController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TriggerReminderController],
      providers: [TriggerReminderService],
    }).compile();

    controller = module.get<TriggerReminderController>(TriggerReminderController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
