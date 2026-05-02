import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entity
import { ShippingEntity } from './domains/entities/shipping.entity';

// Domain Services
import { ShippingDomainService } from './domains/services/shipping-domain.service';

// Infrastructure
import { RajaOngkirAdapter } from './infrastructures/adapters/rajaongkir.adapter';
import { ShippingRepository } from './infrastructures/repositories/shipping.repository';
import { SHIPPING_CONSTANTS } from './domains/constants/shipping.constants';

// Application Use Cases
import { CalculateShippingUseCase } from './applications/use-cases/calculate-shipping.use-case';
import { CreateShippingUseCase } from './applications/use-cases/create-shipping.use-case';
import { TrackShippingUseCase } from './applications/use-cases/track-shipping.use-case';
import { UpdateTrackingUseCase } from './applications/use-cases/update-tracking.use-case';

// Orchestrator
import { ShippingOrchestrator } from './applications/orchestrator/shipping.orchestrator';

// Controllers
import { ShippingPublicController } from './interface/http/shipping-public.controller';
import { ShippingAdminController } from './interface/http/shipping-admin.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ShippingEntity])],
  controllers: [ShippingPublicController, ShippingAdminController],
  providers: [
    // ── Infrastructure tokens ──────────────────────────────────────────────
    {
      provide: SHIPPING_CONSTANTS.REPOSITORY_TOKEN,
      useClass: ShippingRepository,
    },
    {
      provide: SHIPPING_CONSTANTS.PROVIDER_TOKEN,
      useClass: RajaOngkirAdapter, // swap with real RajaOngkirAdapter later
    },

    // ── Domain ────────────────────────────────────────────────────────────
    ShippingDomainService,

    // ── Use Cases ─────────────────────────────────────────────────────────
    CalculateShippingUseCase,
    CreateShippingUseCase,
    TrackShippingUseCase,
    UpdateTrackingUseCase,

    // ── Orchestrator ──────────────────────────────────────────────────────
    ShippingOrchestrator,
  ],
  exports: [ShippingOrchestrator],
})
export class ShippingModule {}