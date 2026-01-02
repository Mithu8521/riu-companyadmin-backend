import { Test, TestingModule } from '@nestjs/testing';
import { EmailNotificationsAndDueDateController } from './email_notifications_and_due_date.controller';
import { EmailNotificationsAndDueDateService } from './email_notifications_and_due_date.service';

describe('EmailNotificationsAndDueDateController', () => {
  let controller: EmailNotificationsAndDueDateController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmailNotificationsAndDueDateController],
      providers: [EmailNotificationsAndDueDateService],
    }).compile();

    controller = module.get<EmailNotificationsAndDueDateController>(EmailNotificationsAndDueDateController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
