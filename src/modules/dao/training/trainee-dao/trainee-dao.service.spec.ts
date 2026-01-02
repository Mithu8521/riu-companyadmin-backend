import { Test, TestingModule } from '@nestjs/testing';
import { TraineeDaoService } from './trainee-dao.service';

describe('TraineeDaoService', () => {
  let service: TraineeDaoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TraineeDaoService],
    }).compile();

    service = module.get<TraineeDaoService>(TraineeDaoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
