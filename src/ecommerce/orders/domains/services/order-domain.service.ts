import { Injectable } from '@nestjs/common';
import { OrderEntity } from '../entities/order.entity';
import { OrderStatus } from '../enum/order-status.enum';

export interface StatusTransitionPayload {
  trackingNumber?: string;
}

/**
 * Mendefinisikan transisi status yang valid dalam state machine order.
 * Key = status saat ini, Value = array status yang boleh dituju.
 */
const VALID_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  [OrderStatus.PENDING_PAYMENT]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [OrderStatus.COMPLETED],
};

@Injectable()
export class OrderDomainService {
  /**
   * Memvalidasi dan mengeksekusi transisi status order.
   * Mendelegasikan ke domain method pada entity untuk menjaga konsistensi.
   */
  public transitionStatus(
    order: OrderEntity,
    targetStatus: OrderStatus,
    payload?: StatusTransitionPayload,
  ): void {
    const allowedNext = VALID_TRANSITIONS[order.status] ?? [];

    if (!allowedNext.includes(targetStatus)) {
      throw new Error(
        `Transisi status tidak valid: "${order.status}" → "${targetStatus}". ` +
        `Status yang diperbolehkan dari "${order.status}": [${allowedNext.join(', ') || 'tidak ada'}].`,
      );
    }

    switch (targetStatus) {
      case OrderStatus.PROCESSING:
        order.confirmPayment();
        break;

      case OrderStatus.SHIPPED:
        if (!payload?.trackingNumber) {
          throw new Error('Nomor resi pengiriman wajib disertakan saat mengubah status ke SHIPPED.');
        }
        order.shipOrder(payload.trackingNumber);
        break;

      case OrderStatus.DELIVERED:
        order.markAsDelivered();
        break;

      case OrderStatus.COMPLETED:
        order.completeOrder();
        break;

      case OrderStatus.CANCELLED:
        order.cancelOrder();
        break;

      default:
        throw new Error(`Transisi ke status "${targetStatus}" belum didukung.`);
    }
  }

  /**
   * Mengambil daftar status berikutnya yang valid dari status saat ini
   */
  public getAllowedNextStatuses(currentStatus: OrderStatus): OrderStatus[] {
    return VALID_TRANSITIONS[currentStatus] ?? [];
  }
}