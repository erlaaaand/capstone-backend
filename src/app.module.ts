import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { validate } from './config/env.validation';
import { UserEntity } from './users/domains/entities/user.entity';
import { PredictionEntity } from './predictions/domains/entities/prediction.entity';
import { UserModule } from './users/user.module';
import { PredictionModule } from './predictions/prediction.module';
import { AiIntegrationModule } from './ai-integration/ai-integration.module';

@Module({
  imports: [
    // ── Global Config ─────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
      envFilePath: [
        `.env.${process.env.NODE_ENV ?? 'development'}.local`,
        `.env.${process.env.NODE_ENV ?? 'development'}`,
        '.env',
      ],
    }),

    // ── Global Event Bus ──────────────────────────────────────
    EventEmitterModule.forRoot({
      wildcard: false,
      global: true,
    }),

    // ── Database ──────────────────────────────────────────────
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.getOrThrow<string>('DB_HOST'),
        port: config.getOrThrow<number>('DB_PORT'),
        username: config.getOrThrow<string>('DB_USERNAME'),
        password: config.getOrThrow<string>('DB_PASSWORD'),
        database: config.getOrThrow<string>('DB_DATABASE'),
        entities: [UserEntity, PredictionEntity],
        synchronize: config.get<string>('NODE_ENV') !== 'production',
        logging: config.get<string>('NODE_ENV') === 'development',
        timezone: '+07:00',
        charset: 'utf8mb4',
        extra: { connectionLimit: 10 },
      }),
    }),

    // ── Feature Modules ───────────────────────────────────────
    UserModule,
    PredictionModule,
    AiIntegrationModule,
  ],
})
export class AppModule {}
