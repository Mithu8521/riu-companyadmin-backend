import { Test, TestingModule } from '@nestjs/testing';
import { UserDaoService } from './user-dao.service';

describe('UserDaoService', () => {
  let service: UserDaoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserDaoService],
    }).compile();

    service = module.get<UserDaoService>(UserDaoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
