import { Test, TestingModule } from '@nestjs/testing';
import { EmissionDaoService } from './emission-dao.service';

describe('EmissionDaoService', () => {
  let service: EmissionDaoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmissionDaoService],
    }).compile();

    service = module.get<EmissionDaoService>(EmissionDaoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
