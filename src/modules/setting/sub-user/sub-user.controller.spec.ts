import { Test, TestingModule } from '@nestjs/testing';
import { SubUserController } from './sub-user.controller';
import { SubUserService } from './sub-user.service';

describe('SubUserController', () => {
  let controller: SubUserController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubUserController],
      providers: [SubUserService],
    }).compile();

    controller = module.get<SubUserController>(SubUserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
