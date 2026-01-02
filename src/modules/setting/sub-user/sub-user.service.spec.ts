import { Test, TestingModule } from '@nestjs/testing';
import { SubUserService } from './sub-user.service';

describe('SubUserService', () => {
  let service: SubUserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SubUserService],
    }).compile();

    service = module.get<SubUserService>(SubUserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
