import { Test, TestingModule } from '@nestjs/testing';
import { SupplierManagementService } from './supplier_management.service';

describe('SupplierManagementService', () => {
  let service: SupplierManagementService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SupplierManagementService],
    }).compile();

    service = module.get<SupplierManagementService>(SupplierManagementService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
