import { Test, TestingModule } from '@nestjs/testing';
import { TopicDaoService } from './topic-dao.service';

describe('TopicDaoService', () => {
  let service: TopicDaoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TopicDaoService],
    }).compile();

    service = module.get<TopicDaoService>(TopicDaoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
