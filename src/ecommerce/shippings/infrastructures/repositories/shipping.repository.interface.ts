import { ShippingEntity } from '../../domains/entities/shipping.entity';
import { ShippingStatus } from '../../domains/enum/shipping-status.enum';

export interface IShippingRepository {
  findById(id: string): Promise<ShippingEntity | null>;
  findByOrderId(orderId: string): Promise<ShippingEntity | null>;
  findByTrackingNumber(trackingNumber: string): Promise<ShippingEntity | null>;
  findAll(options?: {
    status?: ShippingStatus;
    page?: number;
    limit?: number;
  }): Promise<{ data: ShippingEntity[]; total: number }>;
  save(shipping: Partial<ShippingEntity>): Promise<ShippingEntity>;
  update(id: string, shipping: Partial<ShippingEntity>): Promise<ShippingEntity>;
  delete(id: string): Promise<void>;
}