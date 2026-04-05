// src/ai-integration/ai-integration.module.ts
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

// ── Health Monitor ────────────────────────────────────────────────────────────
import { AiHealthService } from './infrastructures/health/ai-health.service';
import { AiHealthController } from './infrastructures/health/ai-health.controller';
import { AiOnlineGuard } from './infrastructures/health/ai-online.guard';

// ── Adapter ───────────────────────────────────────────────────────────────────
import { AiHttpAdapter } from './infrastructures/repositories/ai-http.adapter';
import { AI_HTTP_ADAPTER_TOKEN } from './infrastructures/repositories/ai-http.adapter.interface';

// ── Domain ────────────────────────────────────────────────────────────────────
import { AiIntegrationDomainService } from './domains/services/ai-integration-domain.service';
import { AiResponseValidator } from './domains/validators/ai-response.validator';
import { AiResponseMapper } from './domains/mappers/ai-response.mapper';

// ── Application ───────────────────────────────────────────────────────────────
import { ProcessPredictionUseCase } from './applications/use-cases/process-prediction.use-case';
import { AiIntegrationOrchestrator } from './applications/orchestrator/ai-integration.orchestrator';

// ── Listener ──────────────────────────────────────────────────────────────────
import { AiPredictionCreatedListener } from './infrastructures/listeners/prediction-created.listener';

// ── External ──────────────────────────────────────────────────────────────────
import { PredictionModule } from '../predictions/prediction.module';

@Module({
  imports: [
    // ConfigModule di-import eksplisit agar tersedia saat isolated testing
    ConfigModule,

    HttpModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        baseURL: config.getOrThrow<string>('FASTAPI_BASE_URL'),
        timeout: 10_000,
      }),
    }),

    // PredictionModule menyediakan PREDICTION_REPOSITORY_TOKEN
    PredictionModule,
  ],
  controllers: [
    // GET /api/v1/ai/status        → SSE stream
    // GET /api/v1/ai/status/current → REST one-shot
    AiHealthController,
  ],
  providers: [
    // ── Health Monitor ─────────────────────────────────────────
    AiHealthService,
    AiOnlineGuard,

    // ── AI HTTP Adapter ────────────────────────────────────────
    {
      provide: AI_HTTP_ADAPTER_TOKEN,
      useClass: AiHttpAdapter,
    },

    // ── Domain Layer ───────────────────────────────────────────
    AiIntegrationDomainService,
    AiResponseValidator,
    AiResponseMapper,

    // ── Application Layer ──────────────────────────────────────
    ProcessPredictionUseCase,
    AiIntegrationOrchestrator,

    // ── Event Listener ─────────────────────────────────────────
    AiPredictionCreatedListener,
  ],
  exports: [
    // Di-export agar module lain bisa inject tanpa redeclare
    AiHealthService,
    AiOnlineGuard,
  ],
})
export class AiIntegrationModule {}
