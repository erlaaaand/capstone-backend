import { OrderEntity } from '../entities/order.entity';
import { OrderItemEntity } from '../entities/order-item.entity';

export interface IOrderItemResponse {
  id: string;
  productId: string;
  productName: string;
  productVariety: string;
  quantity: number;
  pricePerUnit: number;
  subtotal: number;
}

export interface IOrderResponse {
  id: string;
  userId: string;
  items: IOrderItemResponse[];
  totalAmount: number;
  status: string;
  paymentStatus: string;
  recipientName: string | null;
  shippingAddress: string | null;
  recipientPhone: string | null;
  trackingNumber: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class OrderMapper {
  public static itemToResponse(item: OrderItemEntity): IOrderItemResponse {
    return {
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      productVariety: item.productVariety,
      quantity: item.quantity,
      pricePerUnit: Number(item.pricePerUnit),
      subtotal: Number(item.subtotal),
    };
  }

  public static toResponse(order: OrderEntity): IOrderResponse {
    return {
      id: order.id,
      userId: order.userId,
      items: (order.items ?? []).map((item) => OrderMapper.itemToResponse(item)),
      totalAmount: Number(order.totalAmount),
      status: order.status,
      paymentStatus: order.paymentStatus,
      recipientName: order.recipientName,
      shippingAddress: order.shippingAddress,
      recipientPhone: order.recipientPhone,
      trackingNumber: order.trackingNumber,
      notes: order.notes,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  public static toResponseList(orders: OrderEntity[]): IOrderResponse[] {
    return orders.map((o) => OrderMapper.toResponse(o));
  }
}