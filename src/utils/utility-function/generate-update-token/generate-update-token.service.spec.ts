import { Test, TestingModule } from '@nestjs/testing';
import { GenerateUpdateTokenService } from './generate-update-token.service';

describe('GenerateUpdateTokenService', () => {
  let service: GenerateUpdateTokenService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GenerateUpdateTokenService],
    }).compile();

    service = module.get<GenerateUpdateTokenService>(GenerateUpdateTokenService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
