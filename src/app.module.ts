// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerModuleOptions } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';

import { validate } from './config/env.validation';
import { UserEntity } from './users/domains/entities/user.entity';
import { PredictionEntity } from './predictions/domains/entities/prediction.entity';
import { UserModule } from './users/user.module';
import { PredictionModule } from './predictions/prediction.module';
import { AiIntegrationModule } from './ai-integration/ai-integration.module';

@Module({
  imports: [

    ConfigModule.forRoot({
      isGlobal: true,
      validate,
      envFilePath: [
        `.env.${process.env.NODE_ENV ?? 'development'}.local`,
        `.env.${process.env.NODE_ENV ?? 'development'}`,
        '.env',
      ],
    }),

    EventEmitterModule.forRoot({
      wildcard: false,
      global: true,
      maxListeners: 20,
      verboseMemoryLeak: process.env.NODE_ENV !== 'production',
    }),

    ScheduleModule.forRoot(),

    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): ThrottlerModuleOptions => ({
        throttlers: [
          {
            name: 'default',
            ttl: config.get<number>('THROTTLE_TTL_DEFAULT', 60_000),
            limit: config.get<number>('THROTTLE_LIMIT_DEFAULT', 100),
          },
          {
            name: 'strict',
            ttl: config.get<number>('THROTTLE_TTL_STRICT', 60_000),
            limit: config.get<number>('THROTTLE_LIMIT_STRICT', 10),
          },
        ],
        errorMessage:
          'Terlalu banyak request. Silakan coba lagi dalam beberapa saat.',
      }),
    }),

    // ── 5. Database ───────────────────────────────────────────
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): TypeOrmModuleOptions => {
        const nodeEnv = config.getOrThrow<string>('NODE_ENV');
        const isSynchronizeEnabled = nodeEnv !== 'production';

        return {
          type: 'mysql',
          host: config.getOrThrow<string>('DB_HOST'),
          port: config.getOrThrow<number>('DB_PORT'),
          username: config.getOrThrow<string>('DB_USERNAME'),
          password: config.getOrThrow<string>('DB_PASSWORD'),
          database: config.getOrThrow<string>('DB_DATABASE'),
          entities: [UserEntity, PredictionEntity],

          synchronize: isSynchronizeEnabled,

          logging: nodeEnv === 'development' ? ['query', 'error'] : ['error'],

          timezone: '+07:00',
          charset: 'utf8mb4',

          extra: {
            connectionLimit: config.get<number>('DB_CONNECTION_LIMIT', 10),
            acquireTimeout: 10_000,
            // Reconnect otomatis jika koneksi MySQL terputus
            enableKeepAlive: true,
            keepAliveInitialDelay: 30_000,
          },

          retryAttempts: 5,
          retryDelay: 3_000,
        };
      },
    }),

    // ── 6. Feature Modules ────────────────────────────────────
    UserModule,
    PredictionModule,
    AiIntegrationModule,
  ],

  providers: [

    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
