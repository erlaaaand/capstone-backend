import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UpdateOrderStatusDto } from '../dto/update-order-status.dto';
import { OrderResponseDto } from '../dto/order-response.dto';
import { type IOrderRepository, ORDER_REPOSITORY_TOKEN } from '../../infrastructures/repositories/order.repository.interface';
import { OrderDomainService } from '../../domains/services/order-domain.service';
import { OrderMapper } from '../../domains/mappers/order.mapper';

@Injectable()
export class UpdateOrderStatusUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY_TOKEN)
    private readonly orderRepository: IOrderRepository,
    private readonly orderDomainService: OrderDomainService,
  ) {}

  async execute(orderId: string, dto: UpdateOrderStatusDto): Promise<OrderResponseDto> {
    const order = await this.orderRepository.findById(orderId);

    if (!order) {
      throw new NotFoundException(`Order dengan ID "${orderId}" tidak ditemukan.`);
    }

    try {
      this.orderDomainService.transitionStatus(order, dto.status, {
        trackingNumber: dto.trackingNumber,
      });
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }

    const saved = await this.orderRepository.save(order);
    return OrderMapper.toResponse(saved);
  }
}