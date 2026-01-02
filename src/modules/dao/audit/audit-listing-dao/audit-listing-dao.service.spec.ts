import { Test, TestingModule } from '@nestjs/testing';
import { AuditListingDaoService } from './audit-listing-dao.service';

describe('AuditListingDaoService', () => {
  let service: AuditListingDaoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuditListingDaoService],
    }).compile();

    service = module.get<AuditListingDaoService>(AuditListingDaoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
