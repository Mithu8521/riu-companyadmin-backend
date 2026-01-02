import { Test, TestingModule } from '@nestjs/testing';
import { EmailReminderDueDateDaoService } from './email_notifications_and_due_date-dao.service';

describe('EmailReminderDueDateDaoService', () => {
  let service: EmailReminderDueDateDaoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailReminderDueDateDaoService],
    }).compile();

    service = module.get<EmailReminderDueDateDaoService>(EmailReminderDueDateDaoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
