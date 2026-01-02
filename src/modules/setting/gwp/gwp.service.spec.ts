import { Test, TestingModule } from '@nestjs/testing';
import { GwpService } from './gwp.service';

describe('GwpService', () => {
  let service: GwpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GwpService],
    }).compile();

    service = module.get<GwpService>(GwpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
