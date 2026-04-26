import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CartResponseDto } from '../dto/cart-response.dto';
import { type ICartRepository, CART_REPOSITORY_TOKEN } from '../../infrastructures/repositories/cart.repository.interface';
import { CartMapper } from '../../domains/mappers/cart.mapper';

@Injectable()
export class RemoveFromCartUseCase {
  constructor(
    @Inject(CART_REPOSITORY_TOKEN)
    private readonly cartRepository: ICartRepository,
  ) {}

  async execute(userId: string, productId: string): Promise<CartResponseDto> {
    const cart = await this.cartRepository.findByUserId(userId);
    if (!cart) {
      throw new NotFoundException('Keranjang belanja tidak ditemukan.');
    }

    try {
      cart.removeItem(productId);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }

    const saved = await this.cartRepository.save(cart);
    return CartMapper.toResponse(saved);
  }
}