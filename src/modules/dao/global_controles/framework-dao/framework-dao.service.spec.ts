import { Test, TestingModule } from '@nestjs/testing';
import { FrameworkDaoService } from './framework-dao.service';

describe('FrameworkDaoService', () => {
  let service: FrameworkDaoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FrameworkDaoService],
    }).compile();

    service = module.get<FrameworkDaoService>(FrameworkDaoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
