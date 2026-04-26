import { ICartItemResponse } from '../../domains/mappers/cart.mapper';

export class CartItemResponseDto implements ICartItemResponse {
  id: string = '';
  productId: string = '';
  quantity: number = 0;
  priceAtAdded: number = 0;
  subtotal: number = 0;
  createdAt: Date = new Date();
}