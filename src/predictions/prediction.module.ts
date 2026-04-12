// src/predictions/prediction.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entity
import { PredictionEntity } from './domains/entities/prediction.entity';

// Repository
import { PredictionRepository } from './infrastructures/repositories/prediction.repository';
import { PREDICTION_REPOSITORY_TOKEN } from './infrastructures/repositories/prediction.repository.interface';

// Domain
import { PredictionDomainService } from './domains/services/prediction-domain.service';
import { PredictionValidator } from './domains/validators/prediction.validator';
import { PredictionMapper } from './domains/mappers/prediction.mapper';

// Use Cases
import { CreatePredictionUseCase } from './applications/use-cases/create-prediction.use-case';
import { FindPredictionByIdUseCase } from './applications/use-cases/find-prediction-by-id.use-case';
import { FindPredictionsByUserUseCase } from './applications/use-cases/find-predictions-by-user.use-case';

// Orchestrator
import { PredictionOrchestrator } from './applications/orchestrator/prediction.orchestrator';

// Controller
import { PredictionController } from './interface/http/prediction.controller';

// Events & Listeners
// FIX [BUG-2 + BUG-3]: AiPredictionCreatedListener DIHAPUS dari sini.
//
// BUG-2: Listener versi predictions/ bergantung pada AiIntegrationOrchestrator,
//        AiIntegrationDomainService, dan AiHealthService — ketiganya TIDAK ada
//        di PredictionModule → NestJS DI error saat startup (app tidak bisa boot).
//
// BUG-3: AiIntegrationModule SUDAH mendaftarkan AiPredictionCreatedListener-nya
//        sendiri via ai-integration/infrastructures/listeners/prediction-created.listener.ts
//        Jika PredictionModule juga mendaftarkan listener 'prediction.created',
//        event tersebut ditangani DUA KALI → AI dipanggil dua kali,
//        dua baris DB ditulis, dan confidence score di-overwrite secara tidak deterministik.
//
// Listener log-only (PredictionCreatedLogListener) di bawah ini cukup untuk
// audit trail tanpa mengganggu alur AI.
import { PredictionCreatedLogListener } from './infrastructures/listeners/prediction-created.listener';

const USE_CASES = [
  CreatePredictionUseCase,
  FindPredictionByIdUseCase,
  FindPredictionsByUserUseCase,
];

@Module({
  imports: [
    TypeOrmModule.forFeature([PredictionEntity]),
  ],
  controllers: [PredictionController],
  providers: [
    // ── Repository (Dependency Inversion) ──────────────────────
    {
      provide: PREDICTION_REPOSITORY_TOKEN,
      useClass: PredictionRepository,
    },

    // ── Domain Layer ───────────────────────────────────────────
    PredictionDomainService,
    PredictionValidator,
    PredictionMapper,

    // ── Application Layer ──────────────────────────────────────
    ...USE_CASES,
    PredictionOrchestrator,

    // ── Event Listeners ────────────────────────────────────────
    // Log-only listener: mencatat event prediction.created untuk audit trail.
    // Semua logika AI dihandle oleh AiPredictionCreatedListener di AiIntegrationModule.
    PredictionCreatedLogListener,
  ],
  exports: [
    PREDICTION_REPOSITORY_TOKEN,
    PredictionMapper,
    CreatePredictionUseCase,
    FindPredictionByIdUseCase,
  ],
})
export class PredictionModule {}
