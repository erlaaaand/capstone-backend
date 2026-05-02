import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { OrderResponseDto } from '../dto/order-response.dto';
import { type IOrderRepository, ORDER_REPOSITORY_TOKEN } from '../../infrastructures/repositories/order.repository.interface';
import { OrderMapper } from '../../domains/mappers/order.mapper';

@Injectable()
export class FindOrderByIdUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY_TOKEN)
    private readonly orderRepository: IOrderRepository,
  ) {}

  /**
   * @param userId  - ID user yang meminta. Jika undefined, diasumsikan request dari admin (bypass ownership check).
   */
  async execute(orderId: string, userId?: string): Promise<OrderResponseDto> {
    const order = await this.orderRepository.findById(orderId);

    if (!order) {
      throw new NotFoundException(`Order dengan ID "${orderId}" tidak ditemukan.`);
    }

    // Ownership check: user biasa hanya boleh melihat order miliknya sendiri
    if (userId && order.userId !== userId) {
      throw new ForbiddenException('Anda tidak memiliki akses ke order ini.');
    }

    return OrderMapper.toResponse(order);
  }
}