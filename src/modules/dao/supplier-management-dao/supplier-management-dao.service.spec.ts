import { Test, TestingModule } from '@nestjs/testing';
import { SupplierManagementDaoService } from './supplier-management-dao.service';

describe('SupplierManagementDaoService', () => {
  let service: SupplierManagementDaoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SupplierManagementDaoService],
    }).compile();

    service = module.get<SupplierManagementDaoService>(SupplierManagementDaoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
