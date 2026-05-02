import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderEntity } from '../../domains/entities/order.entity';
import { IOrderRepository, FindUserOrdersOptions } from './order.repository.interface';

@Injectable()
export class OrderRepository implements IOrderRepository {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly ormRepo: Repository<OrderEntity>,
  ) {}

  async create(order: Partial<OrderEntity>): Promise<OrderEntity> {
    const entity = this.ormRepo.create(order);
    return this.ormRepo.save(entity);
  }

  async findById(id: string): Promise<OrderEntity | null> {
    return this.ormRepo.findOne({
      where: { id },
      relations: ['items'],
    });
  }

  async findByUserId(
    userId: string,
    options: FindUserOrdersOptions = {},
  ): Promise<{ data: OrderEntity[]; total: number }> {
    const { page = 1, limit = 10, status } = options;

    const qb = this.ormRepo
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .where('order.userId = :userId', { userId });

    if (status) {
      qb.andWhere('order.status = :status', { status });
    }

    qb.orderBy('order.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async findAll(options: FindUserOrdersOptions = {}): Promise<{ data: OrderEntity[]; total: number }> {
    const { page = 1, limit = 10, status } = options;

    const qb = this.ormRepo
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items');

    if (status) {
      qb.andWhere('order.status = :status', { status });
    }

    qb.orderBy('order.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async save(order: OrderEntity): Promise<OrderEntity> {
    return this.ormRepo.save(order);
  }

  async existsById(id: string): Promise<boolean> {
    const count = await this.ormRepo.count({ where: { id } });
    return count > 0;
  }
}