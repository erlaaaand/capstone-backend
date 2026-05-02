import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ShippingStatus } from '../enum/shipping-status.enum';
import { CourierType } from '../enum/courier-type.enum';

export interface TrackingHistory {
  status: ShippingStatus;
  description: string;
  location?: string;
  timestamp: Date;
}

@Entity('shippings')
@Index(['orderId'])
@Index(['trackingNumber'])
export class ShippingEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string = '';

  @Column({ name: 'order_id' })
  orderId: string = '';

  @Column({ name: 'tracking_number', nullable: true })
  trackingNumber: string = '';

  @Column({ type: 'enum', enum: CourierType })
  courier: CourierType = CourierType.JNE;

  @Column({ name: 'courier_service' })
  courierService: string = ''; // e.g. 'REG', 'YES', 'OKE'

  @Column({ type: 'enum', enum: ShippingStatus, default: ShippingStatus.PENDING })
  status: ShippingStatus = ShippingStatus.PENDING;

  @Column({ name: 'origin_city_id' })
  originCityId: string = '';

  @Column({ name: 'origin_city_name' })
  originCityName: string = '';

  @Column({ name: 'destination_city_id' })
  destinationCityId: string = '';

  @Column({ name: 'destination_city_name' })
  destinationCityName: string = '';

  @Column({ name: 'recipient_name' })
  recipientName: string = '';

  @Column({ name: 'recipient_phone' })
  recipientPhone: string = '';

  @Column({ name: 'recipient_address', type: 'text' })
  recipientAddress: string = '';

  @Column({ name: 'weight_grams', type: 'int' })
  weightGrams: number = 0;

  @Column({ name: 'shipping_cost', type: 'int' })
  shippingCost: number = 0;

  @Column({ name: 'insurance_cost', type: 'int', default: 0 })
  insuranceCost: number = 0;

  @Column({ name: 'estimated_days', type: 'int', nullable: true })
  estimatedDays: number = 0;

  @Column({ name: 'estimated_delivery', type: 'timestamp', nullable: true })
  estimatedDelivery: Date = new Date();

  @Column({ name: 'actual_delivery', type: 'timestamp', nullable: true })
  actualDelivery: Date = new Date();

  @Column({ name: 'tracking_history', type: 'json', default: [] })
  trackingHistory: TrackingHistory[] = [];

  @Column({ name: 'notes', nullable: true, type: 'text' })
  notes: string = '';

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date = new Date();

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date = new Date();
}