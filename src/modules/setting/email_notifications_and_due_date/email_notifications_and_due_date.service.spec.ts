import { Test, TestingModule } from '@nestjs/testing';
import { EmailNotificationsAndDueDateService } from './email_notifications_and_due_date.service';

describe('EmailNotificationsAndDueDateService', () => {
  let service: EmailNotificationsAndDueDateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailNotificationsAndDueDateService],
    }).compile();

    service = module.get<EmailNotificationsAndDueDateService>(EmailNotificationsAndDueDateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
