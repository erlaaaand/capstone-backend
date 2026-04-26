import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { CartEntity } from './domains/entities/cart.entity';
import { CartItemEntity } from './domains/entities/cart-item.entity';

// Domain Services
import { CartDomainService } from './domains/services/cart-domain.service';

// Infrastructure
import { CartRepository } from './infrastructures/repositories/cart.repository';
import { CART_REPOSITORY_TOKEN } from './infrastructures/repositories/cart.repository.interface';
import { CartCreatedListener } from './infrastructures/listeners/cart-created.listeners';

// Use Cases
import { ViewCartUseCase } from './applications/use-cases/view-cart.use-case';
import { AddToCartUseCase } from './applications/use-cases/add-to-cart.use-case';
import { UpdateCartItemUseCase } from './applications/use-cases/update-cart-item.use-case';
import { RemoveFromCartUseCase } from './applications/use-cases/remove-from-cart.use-case';
import { ClearCartUseCase } from './applications/use-cases/clear-cart.use-case';

// Orchestrator
import { CartOrchestrator } from './applications/orchestrator/cart.orchestrator';

// Controller
import { CartController } from './interface/http/cart.controller';

// Product Module (dibutuhkan untuk validasi stok saat add/update cart)
import { ProductModule } from '../products/product.module';

const USE_CASES = [
  ViewCartUseCase,
  AddToCartUseCase,
  UpdateCartItemUseCase,
  RemoveFromCartUseCase,
  ClearCartUseCase,
];

@Module({
  imports: [
    TypeOrmModule.forFeature([CartEntity, CartItemEntity]),
    // Import ProductModule agar PRODUCT_REPOSITORY_TOKEN tersedia untuk use cases cart
    ProductModule,
  ],
  controllers: [CartController],
  providers: [
    {
      provide: CART_REPOSITORY_TOKEN,
      useClass: CartRepository,
    },
    CartDomainService,
    CartCreatedListener,
    ...USE_CASES,
    CartOrchestrator,
  ],
  exports: [CartOrchestrator, CART_REPOSITORY_TOKEN],
})
export class CartModule {}
