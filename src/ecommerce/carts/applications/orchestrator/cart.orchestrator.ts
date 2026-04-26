import { Injectable } from '@nestjs/common';
import { AddToCartDto } from '../dto/add-to-cart.dto';
import { UpdateCartItemDto } from '../dto/update-cart-item.dto';
import { CartResponseDto } from '../dto/cart-response.dto';
import { ViewCartUseCase } from '../use-cases/view-cart.use-case';
import { AddToCartUseCase } from '../use-cases/add-to-cart.use-case';
import { UpdateCartItemUseCase } from '../use-cases/update-cart-item.use-case';
import { RemoveFromCartUseCase } from '../use-cases/remove-from-cart.use-case';
import { ClearCartUseCase } from '../use-cases/clear-cart.use-case';

@Injectable()
export class CartOrchestrator {
  constructor(
    private readonly viewCartUseCase: ViewCartUseCase,
    private readonly addToCartUseCase: AddToCartUseCase,
    private readonly updateCartItemUseCase: UpdateCartItemUseCase,
    private readonly removeFromCartUseCase: RemoveFromCartUseCase,
    private readonly clearCartUseCase: ClearCartUseCase,
  ) {}

  async viewCart(userId: string): Promise<CartResponseDto> {
    return this.viewCartUseCase.execute(userId);
  }

  async addToCart(userId: string, dto: AddToCartDto): Promise<CartResponseDto> {
    return this.addToCartUseCase.execute(userId, dto);
  }

  async updateCartItem(userId: string, productId: string, dto: UpdateCartItemDto): Promise<CartResponseDto> {
    return this.updateCartItemUseCase.execute(userId, productId, dto);
  }

  async removeFromCart(userId: string, productId: string): Promise<CartResponseDto> {
    return this.removeFromCartUseCase.execute(userId, productId);
  }

  async clearCart(userId: string): Promise<CartResponseDto> {
    return this.clearCartUseCase.execute(userId);
  }
}