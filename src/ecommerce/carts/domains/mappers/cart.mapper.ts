import { CartEntity } from '../entities/cart.entity';
import { CartItemEntity } from '../entities/cart-item.entity';

export interface ICartItemResponse {
  id: string;
  productId: string;
  quantity: number;
  priceAtAdded: number;
  subtotal: number;
  createdAt: Date;
}

export interface ICartResponse {
  id: string;
  userId: string;
  items: ICartItemResponse[];
  summary: {
    totalItems: number;
    totalPrice: number;
  };
  updatedAt: Date;
}

export class CartMapper {
  public static itemToResponse(item: CartItemEntity): ICartItemResponse {
    return {
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      priceAtAdded: Number(item.priceAtAdded),
      subtotal: item.calculateSubtotal(),
      createdAt: item.createdAt,
    };
  }

  public static toResponse(cart: CartEntity): ICartResponse {
    return {
      id: cart.id,
      userId: cart.userId,
      items: (cart.items ?? []).map((item) => CartMapper.itemToResponse(item)),
      summary: {
        totalItems: cart.calculateTotalItems(),
        totalPrice: cart.calculateTotalPrice(),
      },
      updatedAt: cart.updatedAt,
    };
  }
}