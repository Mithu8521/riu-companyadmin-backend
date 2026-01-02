import { Test, TestingModule } from '@nestjs/testing';
import { HtmlReaderService } from './html-reader.service';

describe('HtmlReaderService', () => {
  let service: HtmlReaderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HtmlReaderService],
    }).compile();

    service = module.get<HtmlReaderService>(HtmlReaderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
