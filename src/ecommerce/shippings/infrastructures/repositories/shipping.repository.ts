import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShippingEntity } from '../../domains/entities/shipping.entity';
import { ShippingStatus } from '../../domains/enum/shipping-status.enum';
import { IShippingRepository } from './shipping.repository.interface';
import { SHIPPING_ERRORS } from '../../domains/constants/shipping.constants';

@Injectable()
export class ShippingRepository implements IShippingRepository {
  constructor(
    @InjectRepository(ShippingEntity)
    private readonly repo: Repository<ShippingEntity>,
  ) {}

  async findById(id: string): Promise<ShippingEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByOrderId(orderId: string): Promise<ShippingEntity | null> {
    return this.repo.findOne({ where: { orderId } });
  }

  async findByTrackingNumber(trackingNumber: string): Promise<ShippingEntity | null> {
    return this.repo.findOne({ where: { trackingNumber } });
  }

  async findAll(options?: {
    status?: ShippingStatus;
    page?: number;
    limit?: number;
  }): Promise<{ data: ShippingEntity[]; total: number }> {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 10;
    const skip = (page - 1) * limit;

    const qb = this.repo.createQueryBuilder('shipping');

    if (options?.status) {
      qb.where('shipping.status = :status', { status: options.status });
    }

    qb.orderBy('shipping.createdAt', 'DESC').skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async save(shipping: Partial<ShippingEntity>): Promise<ShippingEntity> {
    const entity = this.repo.create(shipping);
    return this.repo.save(entity);
  }

  async update(id: string, shipping: Partial<ShippingEntity>): Promise<ShippingEntity> {
    const existing = await this.findById(id);
    if (!existing) throw new NotFoundException(SHIPPING_ERRORS.NOT_FOUND);
    Object.assign(existing, shipping);
    return this.repo.save(existing);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}