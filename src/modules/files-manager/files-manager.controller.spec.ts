import { Test, TestingModule } from '@nestjs/testing';
import { FilesManagerController } from './files-manager.controller';
import { FilesManagerService } from './files-manager.service';

describe('UploadFileController', () => {
  let controller: FilesManagerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FilesManagerController],
      providers: [FilesManagerService],
    }).compile();

    controller = module.get<FilesManagerController>(FilesManagerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
