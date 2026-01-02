import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as mqtt from 'mqtt';
import { createHash } from 'crypto';
import { RawEvent } from '../../entities/raw-events.entity';

@Injectable()
export class MqttConsumer implements OnModuleInit {
  private readonly logger = new Logger(MqttConsumer.name);

  constructor(
    @InjectRepository(RawEvent, 'postgresql')
    private readonly repo: Repository<RawEvent>,
  ) {}

  onModuleInit() {
    this.logger.log(`🚀 MqttConsumer initialized (pid=${process.pid})`);
    const client = mqtt.connect(process.env.MQTT_URL!, {
      clientId: 'riu-raw-ingestor-1', // 👈 STABLE ID
      clean: false,
      username: process.env.MQTT_USERNAME,
      password: process.env.MQTT_PASSWORD,
    });

    client.on('connect', () => {
      this.logger.log('✅ MQTT connected');
      client.subscribe(process.env.MQTT_TOPIC!, { qos: 1 });
    });

    client.on('message', async (topic, message) => {
      this.logger.log(`📩 Message received on ${topic}`);

      const payload = message.toString('utf8').replace('mass_totalizer_reverse_ flow', 'mass_totalizer_reverse_flow'); // raw payload

      const eventHash = createHash('sha256')
        .update(payload)
        .digest('hex');

      try {
        await this.repo
          .createQueryBuilder()
          .insert()
          .into(RawEvent)
          .values({
            payload: payload as any,
            status: 'PENDING',
            retryCount: 0,
            eventHash,
          })
          .orIgnore()
          .execute();

        this.logger.log(`✅ RawEvent stored (hash=${eventHash})`);
      } catch (err) {
        this.logger.error('❌ Raw ingest failed', err);
      }
    });

  }
}
