import { Test, TestingModule } from '@nestjs/testing';
import { TriggerReminderService } from './trigger_reminder.service';

describe('TriggerReminderService', () => {
  let service: TriggerReminderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TriggerReminderService],
    }).compile();

    service = module.get<TriggerReminderService>(TriggerReminderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
