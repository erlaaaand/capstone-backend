import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';

// Entity
import { ProductEntity } from './domains/entities/product.entity';

// Domain Services
import { ProductDomainService } from './domains/services/product-domain.service';

// Infrastructure
import { ProductRepository } from './infrastructures/repositories/product.repository';
import { PRODUCT_REPOSITORY_TOKEN } from './infrastructures/repositories/product.repository.interface';
import { AiPredictionVerifiedListener } from './infrastructures/listeners/ai-prediction-verified.listener';

// Use Cases
import { CreateProductUseCase } from './applications/use-cases/create-product.use-case';
import { FindAllProductsUseCase } from './applications/use-cases/find-all-products.use-case';
import { FindProductByIdUseCase } from './applications/use-cases/find-product-by-id.use-case';
import { UpdateProductUseCase } from './applications/use-cases/update-product.use-case';
import { UpdateProductStockUseCase } from './applications/use-cases/update-product-stock.use-case';
import { DeleteProductUseCase } from './applications/use-cases/delete-product.use-case';
import { VerifyAiCertificateUseCase } from './applications/use-cases/verify-ai-certificate.use-case';

// Orchestrator
import { ProductOrchestrator } from './applications/orchestrator/product.orchestrator';

// Controllers
import { ProductPublicController } from './interface/http/product-public.controller';
import { ProductAdminController } from './interface/http/product-admin.controller';

const USE_CASES = [
  CreateProductUseCase,
  FindAllProductsUseCase,
  FindProductByIdUseCase,
  UpdateProductUseCase,
  UpdateProductStockUseCase,
  DeleteProductUseCase,
  VerifyAiCertificateUseCase,
];

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductEntity]),
    EventEmitterModule.forRoot(),
  ],
  controllers: [
    ProductPublicController,
    ProductAdminController,
  ],
  providers: [
    // Binding interface ke implementasi konkret
    {
      provide: PRODUCT_REPOSITORY_TOKEN,
      useClass: ProductRepository,
    },
    // Domain Services
    ProductDomainService,
    // Infrastructure Listeners
    AiPredictionVerifiedListener,
    // Use Cases
    ...USE_CASES,
    // Orchestrator (facade untuk controller)
    ProductOrchestrator,
  ],
  exports: [
    ProductOrchestrator,
    PRODUCT_REPOSITORY_TOKEN,
  ],
})
export class ProductModule {}
