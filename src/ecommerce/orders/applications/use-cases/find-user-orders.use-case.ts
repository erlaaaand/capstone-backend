import { Inject, Injectable } from '@nestjs/common';
import { OrderResponseDto } from '../dto/order-response.dto';
import { type IOrderRepository, ORDER_REPOSITORY_TOKEN } from '../../infrastructures/repositories/order.repository.interface';
import { OrderMapper } from '../../domains/mappers/order.mapper';
import { OrderStatus } from '../../domains/enum/order-status.enum';

export interface FindUserOrdersQuery {
  page?: number;
  limit?: number;
  status?: OrderStatus;
}

export interface PaginatedOrderResponse {
  data: OrderResponseDto[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

@Injectable()
export class FindUserOrdersUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY_TOKEN)
    private readonly orderRepository: IOrderRepository,
  ) {}

  /**
   * @param userId - Jika undefined, ambil semua order (untuk admin).
   */
  async execute(query: FindUserOrdersQuery, userId?: string): Promise<PaginatedOrderResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const options = { page, limit, status: query.status };

    const { data, total } = userId
      ? await this.orderRepository.findByUserId(userId, options)
      : await this.orderRepository.findAll(options);

    const totalPages = Math.ceil(total / limit);

    return {
      data: OrderMapper.toResponseList(data),
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }
}