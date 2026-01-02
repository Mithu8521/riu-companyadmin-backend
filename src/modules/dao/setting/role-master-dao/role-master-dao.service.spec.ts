import { Test, TestingModule } from '@nestjs/testing';
import { RoleMasterDaoService } from './role-master-dao.service';

describe('RoleMasterDaoService', () => {
  let service: RoleMasterDaoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RoleMasterDaoService],
    }).compile();

    service = module.get<RoleMasterDaoService>(RoleMasterDaoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
