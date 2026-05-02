import { IOrderResponse, IOrderItemResponse } from '../../domains/mappers/order.mapper';

export class OrderItemResponseDto implements IOrderItemResponse {
  id: string = '';
  productId: string = '';
  productName: string = '';
  productVariety: string = '';
  quantity: number = 0;
  pricePerUnit: number = 0;
  subtotal: number = 0;
}

export class OrderResponseDto implements IOrderResponse {
  id: string = '';
  userId: string = '';
  items: OrderItemResponseDto[] = [];
  totalAmount: number = 0;
  status: string = '';
  paymentStatus: string = '';
  recipientName: string | null = null;
  shippingAddress: string | null = null;
  recipientPhone: string | null = null;
  trackingNumber: string | null = null;
  notes: string | null = null;
  createdAt: Date = new Date();
  updatedAt: Date = new Date();
}