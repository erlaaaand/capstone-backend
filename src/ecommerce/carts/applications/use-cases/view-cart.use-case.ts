import { Inject, Injectable } from '@nestjs/common';
import { CartResponseDto } from '../dto/cart-response.dto';
import { type ICartRepository, CART_REPOSITORY_TOKEN } from '../../infrastructures/repositories/cart.repository.interface';
import { CartMapper } from '../../domains/mappers/cart.mapper';

@Injectable()
export class ViewCartUseCase {
  constructor(
    @Inject(CART_REPOSITORY_TOKEN)
    private readonly cartRepository: ICartRepository,
  ) {}

  async execute(userId: string): Promise<CartResponseDto> {
    const cart = await this.cartRepository.findOrCreateByUserId(userId);
    return CartMapper.toResponse(cart);
  }
}