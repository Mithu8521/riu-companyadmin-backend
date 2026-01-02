import { Test, TestingModule } from '@nestjs/testing';
import { FilesManagerService } from './files-manager.service';

describe('FilesManagerService', () => {
  let service: FilesManagerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FilesManagerService],
    }).compile();

    service = module.get<FilesManagerService>(FilesManagerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
