import { Controller } from '@nestjs/common';
import { IotMetersService } from './iot-meters.service';

@Controller('iot-meters')
export class IotMetersController {
  constructor(private readonly iotMetersService: IotMetersService) {}
}
