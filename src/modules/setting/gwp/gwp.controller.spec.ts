import { Test, TestingModule } from '@nestjs/testing';
import { GwpController } from './gwp.controller';
import { GwpService } from './gwp.service';

describe('GwpController', () => {
  let controller: GwpController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GwpController],
      providers: [GwpService],
    }).compile();

    controller = module.get<GwpController>(GwpController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
