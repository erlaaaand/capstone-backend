// src/ai-integration/ai-integration.module.ts
import { Module } from '@nestjs/common';

// Adapter
import { AiHttpAdapter } from './infrastructures/repositories/ai-http.adapter';
import { AI_HTTP_ADAPTER_TOKEN } from './infrastructures/repositories/ai-http.adapter.interface';

// Domain
import { AiIntegrationDomainService } from './domains/services/ai-integration-domain.service';
import { AiResponseValidator } from './domains/validators/ai-response.validator';
import { AiResponseMapper } from './domains/mappers/ai-response.mapper';

// Use Case
import { ProcessPredictionUseCase } from './applications/use-cases/process-prediction.use-case';

// Orchestrator
import { AiIntegrationOrchestrator } from './applications/orchestrator/ai-integration.orchestrator';

// Listener — INI tempat yang benar untuk AiPredictionCreatedListener
import { AiPredictionCreatedListener } from './infrastructures/listeners/prediction-created.listener';

// External Module
import { PredictionModule } from '../predictions/prediction.module';

@Module({
  imports: [PredictionModule],
  providers: [
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
    // FIX: Listener ini ada di sini karena butuh AiIntegrationOrchestrator
    //      dan AiIntegrationDomainService yang keduanya tersedia di module ini.
    AiPredictionCreatedListener,
  ],
})
export class AiIntegrationModule {}
