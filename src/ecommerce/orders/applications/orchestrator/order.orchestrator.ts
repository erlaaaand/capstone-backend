import { Injectable } from '@nestjs/common';
import { CreateOrderDto } from '../dto/create-order.dto';
import { UpdateOrderStatusDto } from '../dto/update-order-status.dto';
import { OrderResponseDto } from '../dto/order-response.dto';
import { CreateOrderUseCase } from '../use-cases/create-order.use-case';
import { FindOrderByIdUseCase } from '../use-cases/find-order-by-id.use-case';
import { FindUserOrdersUseCase, FindUserOrdersQuery, PaginatedOrderResponse } from '../use-cases/find-user-orders.use-case';
import { UpdateOrderStatusUseCase } from '../use-cases/update-order-status.use-case';

@Injectable()
export class OrderOrchestrator {
  constructor(
    private readonly createOrderUseCase: CreateOrderUseCase,
    private readonly findOrderByIdUseCase: FindOrderByIdUseCase,
    private readonly findUserOrdersUseCase: FindUserOrdersUseCase,
    private readonly updateOrderStatusUseCase: UpdateOrderStatusUseCase,
  ) {}

  async createOrder(userId: string, dto: CreateOrderDto): Promise<OrderResponseDto> {
    return this.createOrderUseCase.execute(userId, dto);
  }

  async findOrderById(orderId: string, userId?: string): Promise<OrderResponseDto> {
    return this.findOrderByIdUseCase.execute(orderId, userId);
  }

  async findUserOrders(query: FindUserOrdersQuery, userId?: string): Promise<PaginatedOrderResponse> {
    return this.findUserOrdersUseCase.execute(query, userId);
  }

  async updateOrderStatus(orderId: string, dto: UpdateOrderStatusDto): Promise<OrderResponseDto> {
    return this.updateOrderStatusUseCase.execute(orderId, dto);
  }
}