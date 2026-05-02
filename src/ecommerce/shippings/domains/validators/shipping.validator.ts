import { BadRequestException } from '@nestjs/common';
import { SHIPPING_CONSTANTS, SHIPPING_ERRORS } from '../constants/shipping.constants';
import { ShippingStatus } from '../enum/shipping-status.enum';
import { ShippingEntity } from '../entities/shipping.entity';

// Valid status transitions map
const VALID_TRANSITIONS: Record<ShippingStatus, ShippingStatus[]> = {
  [ShippingStatus.PENDING]: [ShippingStatus.PROCESSING, ShippingStatus.CANCELLED],
  [ShippingStatus.PROCESSING]: [ShippingStatus.PICKED_UP, ShippingStatus.CANCELLED],
  [ShippingStatus.PICKED_UP]: [ShippingStatus.IN_TRANSIT],
  [ShippingStatus.IN_TRANSIT]: [ShippingStatus.OUT_FOR_DELIVERY, ShippingStatus.RETURNED],
  [ShippingStatus.OUT_FOR_DELIVERY]: [ShippingStatus.DELIVERED, ShippingStatus.FAILED],
  [ShippingStatus.DELIVERED]: [],
  [ShippingStatus.FAILED]: [ShippingStatus.IN_TRANSIT, ShippingStatus.RETURNED],
  [ShippingStatus.RETURNED]: [],
  [ShippingStatus.CANCELLED]: [],
};

export class ShippingValidator {
  static validateWeight(weightGrams: number): void {
    if (
      weightGrams < SHIPPING_CONSTANTS.MIN_WEIGHT_GRAMS ||
      weightGrams > SHIPPING_CONSTANTS.MAX_WEIGHT_GRAMS
    ) {
      throw new BadRequestException(SHIPPING_ERRORS.INVALID_WEIGHT);
    }
  }

  static validateStatusTransition(
    shipping: ShippingEntity,
    newStatus: ShippingStatus,
  ): void {
    const allowedNextStatuses = VALID_TRANSITIONS[shipping.status] ?? [];
    if (!allowedNextStatuses.includes(newStatus)) {
      throw new BadRequestException(
        `${SHIPPING_ERRORS.INVALID_STATUS_TRANSITION}: ${shipping.status} → ${newStatus}`,
      );
    }
  }

  static validateCanCancel(shipping: ShippingEntity): void {
    const nonCancellableStatuses = [
      ShippingStatus.IN_TRANSIT,
      ShippingStatus.OUT_FOR_DELIVERY,
      ShippingStatus.DELIVERED,
      ShippingStatus.RETURNED,
      ShippingStatus.CANCELLED,
    ];
    if (nonCancellableStatuses.includes(shipping.status)) {
      throw new BadRequestException(SHIPPING_ERRORS.CANNOT_CANCEL);
    }
  }

  static validateCalculateInput(
    originCityId: string,
    destinationCityId: string,
    weightGrams: number,
  ): void {
    if (!originCityId) throw new BadRequestException(SHIPPING_ERRORS.ORIGIN_REQUIRED);
    if (!destinationCityId) throw new BadRequestException(SHIPPING_ERRORS.DESTINATION_REQUIRED);
    this.validateWeight(weightGrams);
  }
}