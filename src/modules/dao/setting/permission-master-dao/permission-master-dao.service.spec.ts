import { Test, TestingModule } from '@nestjs/testing';
import { PermissionMasterDaoService } from './permission-master-dao.service';

describe('PermissionMasterDaoService', () => {
  let service: PermissionMasterDaoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PermissionMasterDaoService],
    }).compile();

    service = module.get<PermissionMasterDaoService>(PermissionMasterDaoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
