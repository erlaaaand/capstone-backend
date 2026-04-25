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

import { validate } from './shared/config/env.validation';
import { UserEntity } from './identity/users/domains/entities/user.entity';
import { PredictionEntity } from './ai-core/predictions/domains/entities/prediction.entity';
import { MarketPriceEntity } from './market-intelligence/domains/entities/market-price.entity';

import { UserModule } from './identity/users/user.module';
import { AuthModule } from './identity/auth/auth.module';
import { PredictionModule } from './ai-core/predictions/prediction.module';
import { StorageModule } from './shared/storage/storage.module';
import { AiIntegrationModule } from './ai-core/ai-integration/ai-integration.module';
import { MarketIntelligenceModule } from './market-intelligence/market-intelligence.module';

// ── Guards ────────────────────────────────────────────────────
import { JwtAuthGuard } from './identity/auth/interface/guards/jwt-auth.guard';

import { ProductModule } from './ecommerce/products/product.module';

@Module({
  imports: [
    // ── 1. Config (global) ────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
      envFilePath: [
        `.env.${process.env.NODE_ENV ?? 'development'}.local`,
        `.env.${process.env.NODE_ENV ?? 'development'}`,
        '.env',
      ],
    }),

    // ── 2. Event Emitter (global) ─────────────────────────────
    EventEmitterModule.forRoot({
      wildcard: false,
      global: true,
      maxListeners: 20,
      verboseMemoryLeak: process.env.NODE_ENV !== 'production',
    }),

    // ── 3. Scheduler ──────────────────────────────────────────
    ScheduleModule.forRoot(),

    // ── 4. Rate Limiter ───────────────────────────────────────
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
          // [FIX BUG-06] Tambah MarketPriceEntity agar tabel market_prices dibuat
          // oleh TypeORM synchronize saat development / migration saat production
          entities: [UserEntity, PredictionEntity, MarketPriceEntity],
          synchronize: isSynchronizeEnabled,
          logging: nodeEnv === 'development' ? ['query', 'error'] : ['error'],
          timezone: '+07:00',
          charset: 'utf8mb4',
          extra: {
            connectionLimit: config.get<number>('DB_CONNECTION_LIMIT', 10),
            acquireTimeout: 10_000,
            enableKeepAlive: true,
            keepAliveInitialDelay: 30_000,
          },
          retryAttempts: 5,
          retryDelay: 3_000,
        };
      },
    }),

    // ── 6. Feature Modules ────────────────────────────────────
    AuthModule,
    StorageModule,
    UserModule,
    PredictionModule,
    AiIntegrationModule,
    MarketIntelligenceModule,
    ProductModule,
  ],

  providers: [
    // ── Global Guards ──────────────────────────────────────────
    // ThrottlerGuard: rate-limiting untuk semua route
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}