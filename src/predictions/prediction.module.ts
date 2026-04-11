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

// Controller & Filter
import { PredictionController } from './interface/http/prediction.controller';

// Events & Listeners
import { AiPredictionCreatedListener } from './infrastructures/listeners/prediction-created.listener';

const USE_CASES = [
  CreatePredictionUseCase,
  FindPredictionByIdUseCase,
  FindPredictionsByUserUseCase,
];

@Module({
  imports: [
    TypeOrmModule.forFeature([PredictionEntity]),
    // FIX: Hapus forwardRef ke AiIntegrationModule dan ConfigModule —
    //      keduanya tidak dibutuhkan di sini setelah listener dipindahkan.
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
    // FIX: Hanya PredictionCreatedListener (logger saja) yang tetap di sini.
    //      AiPredictionCreatedListener DIPINDAHKAN ke AiIntegrationModule
    //      karena dia butuh AiIntegrationOrchestrator & AiIntegrationDomainService.
    AiPredictionCreatedListener,
  ],
  exports: [
    PREDICTION_REPOSITORY_TOKEN,
    PredictionMapper,
    CreatePredictionUseCase,
    FindPredictionByIdUseCase,
  ],
})
export class PredictionModule {}
