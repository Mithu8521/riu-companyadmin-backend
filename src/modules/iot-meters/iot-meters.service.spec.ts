import { Test, TestingModule } from '@nestjs/testing';
import { IotMetersService } from './iot-meters.service';

describe('IotMetersService', () => {
  let service: IotMetersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IotMetersService],
    }).compile();

    service = module.get<IotMetersService>(IotMetersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
