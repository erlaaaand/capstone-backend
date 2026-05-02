import { Injectable } from '@nestjs/common';
import { ShippingEntity, TrackingHistory } from '../entities/shipping.entity';
import { ShippingStatus } from '../enum/shipping-status.enum';
import { ShippingValidator } from '../validators/shipping.validator';
import { SHIPPING_CONSTANTS } from '../constants/shipping.constants';
import { CourierType } from '../enum/courier-type.enum';

@Injectable()
export class ShippingDomainService {
  /**
   * Calculate insurance cost based on item value
   */
  calculateInsurance(itemValue: number): number {
    return Math.ceil(itemValue * SHIPPING_CONSTANTS.DEFAULT_INSURANCE_RATE);
  }

  /**
   * Calculate estimated delivery date based on estimated days
   */
  calculateEstimatedDelivery(estimatedDays: number): Date {
    const date = new Date();
    date.setDate(date.getDate() + estimatedDays);
    return date;
  }

  /**
   * Generate a mock tracking number
   */
  generateTrackingNumber(courier: CourierType): string {
    const prefix = courier.toUpperCase().slice(0, 3);
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 9000 + 1000);
    return `${prefix}${timestamp}${random}`;
  }

  /**
   * Append a new entry to tracking history
   */
  addTrackingHistory(
    shipping: ShippingEntity,
    status: ShippingStatus,
    description: string,
    location?: string,
  ): TrackingHistory[] {
    const entry: TrackingHistory = {
      status,
      description,
      location,
      timestamp: new Date(),
    };
    return [...(shipping.trackingHistory ?? []), entry];
  }

  /**
   * Transition shipping to a new status with validation
   */
  transitionStatus(
    shipping: ShippingEntity,
    newStatus: ShippingStatus,
    description: string,
    location?: string,
  ): ShippingEntity {
    ShippingValidator.validateStatusTransition(shipping, newStatus);

    shipping.status = newStatus;
    shipping.trackingHistory = this.addTrackingHistory(
      shipping,
      newStatus,
      description,
      location,
    );

    if (newStatus === ShippingStatus.DELIVERED) {
      shipping.actualDelivery = new Date();
    }

    return shipping;
  }

  /**
   * Check if free shipping applies
   */
  isFreeShipping(orderTotal: number): boolean {
    return orderTotal >= SHIPPING_CONSTANTS.FREE_SHIPPING_THRESHOLD;
  }
}