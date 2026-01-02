import { Test, TestingModule } from '@nestjs/testing';
import { ProcessDaoService } from './process-dao.service';

describe('ProcessDaoService', () => {
  let service: ProcessDaoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProcessDaoService],
    }).compile();

    service = module.get<ProcessDaoService>(ProcessDaoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
