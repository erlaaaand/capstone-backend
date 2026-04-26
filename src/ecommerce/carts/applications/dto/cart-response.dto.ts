import { ICartResponse } from '../../domains/mappers/cart.mapper';
import { CartItemResponseDto } from './cart-item-response.dto';

export class CartResponseDto implements ICartResponse {
  id: string = '';
  userId: string = '';
  items: CartItemResponseDto[] = [];
  summary: {
    totalItems: number;
    totalPrice: number;
  } = {
    totalItems: 0,
    totalPrice: 0
  };
  updatedAt: Date = new Date();
}