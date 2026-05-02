import { OrderEntity } from '../../domains/entities/order.entity';

export interface FindUserOrdersOptions {
  page?: number;
  limit?: number;
  status?: string;
}

export interface IOrderRepository {
  create(order: Partial<OrderEntity>): Promise<OrderEntity>;
  findById(id: string): Promise<OrderEntity | null>;
  findByUserId(userId: string, options?: FindUserOrdersOptions): Promise<{ data: OrderEntity[]; total: number }>;
  findAll(options?: FindUserOrdersOptions): Promise<{ data: OrderEntity[]; total: number }>;
  save(order: OrderEntity): Promise<OrderEntity>;
  existsById(id: string): Promise<boolean>;
}

export const ORDER_REPOSITORY_TOKEN = 'IOrderRepository';