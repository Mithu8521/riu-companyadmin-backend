import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from './sname-naming-strategy';
import { MYSQL_ENTITIES } from './mysql.entities';
import { POSTGRESQL_ENTITIES } from './postgresql.entities';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        name: 'default',
        type: 'mysql', // Works with mysql2 too
        host: configService.get('DB_HOST'),
        port: +configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        extra: {
          connectTimeout: 10000,
          enableKeepAlive: true,
          keepAliveInitialDelay: 10000,
          connectionLimit: 10,
          maxIdle: 10,
          idleTimeout: 60000,
          queueLimit: 0,
          waitForConnections: true
        },
        poolSize: 100,
        retryAttempts: 5,
        retryDelay: 5000,
        autoLoadEntities: false,
        entities: MYSQL_ENTITIES,
        namingStrategy: new SnakeNamingStrategy(),
      }),
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      name: 'postgresql',
      useFactory: (config: ConfigService) => ({
        name: 'postgresql',
        type: 'postgres',
        host: config.get('PG_HOST'),
        port: +config.get('PG_PORT'),
        username: config.get('PG_USERNAME'),
        password: config.get('PG_PASSWORD'),
        database: config.get('PG_DATABASE'),
        autoLoadEntities: false,
        entities: POSTGRESQL_ENTITIES,
        namingStrategy: new SnakeNamingStrategy(),
        ssl: false,
      }),
    }),
  ],

  providers: [],
  exports: [],
})

export class DatabaseModule { }
