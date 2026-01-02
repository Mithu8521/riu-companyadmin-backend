import { Test, TestingModule } from '@nestjs/testing';
import { IotMetersController } from './iot-meters.controller';
import { IotMetersService } from './iot-meters.service';

describe('IotMetersController', () => {
  let controller: IotMetersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IotMetersController],
      providers: [IotMetersService],
    }).compile();

    controller = module.get<IotMetersController>(IotMetersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
