import { Test, TestingModule } from '@nestjs/testing';
import { SupplierManagementController } from './supplier_management.controller';
import { SupplierManagementService } from './supplier_management.service';

describe('SupplierManagementController', () => {
  let controller: SupplierManagementController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SupplierManagementController],
      providers: [SupplierManagementService],
    }).compile();

    controller = module.get<SupplierManagementController>(SupplierManagementController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
