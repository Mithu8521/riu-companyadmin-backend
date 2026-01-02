import { Test, TestingModule } from '@nestjs/testing';
import { SourceDaoService } from './source-dao.service';

describe('SourceDaoService', () => {
  let service: SourceDaoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SourceDaoService],
    }).compile();

    service = module.get<SourceDaoService>(SourceDaoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
