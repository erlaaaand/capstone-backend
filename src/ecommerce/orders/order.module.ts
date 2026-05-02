import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { OrderEntity } from './domains/entities/order.entity';
import { OrderItemEntity } from './domains/entities/order-item.entity';

// Domain Services
import { OrderDomainService } from './domains/services/order-domain.service';

// Infrastructure
import { OrderRepository } from './infrastructures/repositories/order.repository';
import { ORDER_REPOSITORY_TOKEN } from './infrastructures/repositories/order.repository.interface';

// Use Cases
import { CreateOrderUseCase } from './applications/use-cases/create-order.use-case';
import { FindOrderByIdUseCase } from './applications/use-cases/find-order-by-id.use-case';
import { FindUserOrdersUseCase } from './applications/use-cases/find-user-orders.use-case';
import { UpdateOrderStatusUseCase } from './applications/use-cases/update-order-status.use-case';

// Orchestrator
import { OrderOrchestrator } from './applications/orchestrator/order.orchestrator';

// Controllers
import { OrderPublicController } from './interface/http/order-public.controller';
import { OrderAdminController } from './interface/http/order-admin.controller';

// Cross-module dependencies
import { ProductModule } from '../products/product.module';
import { CartModule } from '../carts/carts.module';

const USE_CASES = [
  CreateOrderUseCase,
  FindOrderByIdUseCase,
  FindUserOrdersUseCase,
  UpdateOrderStatusUseCase,
];

@Module({
  imports: [
    TypeOrmModule.forFeature([OrderEntity, OrderItemEntity]),
    // Import ProductModule untuk PRODUCT_REPOSITORY_TOKEN (deduct stok saat checkout)
    ProductModule,
    // Import CartModule untuk CART_REPOSITORY_TOKEN (baca keranjang & clear setelah checkout)
    CartModule,
  ],
  controllers: [
    OrderPublicController,
    OrderAdminController,
  ],
  providers: [
    {
      provide: ORDER_REPOSITORY_TOKEN,
      useClass: OrderRepository,
    },
    OrderDomainService,
    ...USE_CASES,
    OrderOrchestrator,
  ],
  exports: [OrderOrchestrator, ORDER_REPOSITORY_TOKEN],
})
export class OrderModule {}