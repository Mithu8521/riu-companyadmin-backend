import { Test, TestingModule } from '@nestjs/testing';
import { AuditHistoryDaoService } from './audit-history-dao.service';

describe('AuditHistoryDaoService', () => {
  let service: AuditHistoryDaoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuditHistoryDaoService],
    }).compile();

    service = module.get<AuditHistoryDaoService>(AuditHistoryDaoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
