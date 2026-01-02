import { Test, TestingModule } from '@nestjs/testing';
import { UnitDaoService } from './unit-dao.service';

describe('UnitDaoService', () => {
  let service: UnitDaoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UnitDaoService],
    }).compile();

    service = module.get<UnitDaoService>(UnitDaoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
