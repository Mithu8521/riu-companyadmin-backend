import { Test, TestingModule } from '@nestjs/testing';
import { SubUserDaoService } from './sub-user-dao.service';

describe('SubUserDaoService', () => {
  let service: SubUserDaoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SubUserDaoService],
    }).compile();

    service = module.get<SubUserDaoService>(SubUserDaoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
