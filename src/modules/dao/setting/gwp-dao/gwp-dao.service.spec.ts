import { Test, TestingModule } from '@nestjs/testing';
import { GwpDaoService } from './gwp-dao.service';

describe('GwpDaoService', () => {
  let service: GwpDaoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GwpDaoService],
    }).compile();

    service = module.get<GwpDaoService>(GwpDaoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
