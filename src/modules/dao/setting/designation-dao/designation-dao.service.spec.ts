import { Test, TestingModule } from '@nestjs/testing';
import { DesignationDaoService } from './designation-dao.service';

describe('DesignationDaoService', () => {
  let service: DesignationDaoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DesignationDaoService],
    }).compile();

    service = module.get<DesignationDaoService>(DesignationDaoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
