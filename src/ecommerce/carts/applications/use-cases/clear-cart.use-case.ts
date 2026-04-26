import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CartResponseDto } from '../dto/cart-response.dto';
import { type ICartRepository, CART_REPOSITORY_TOKEN } from '../../infrastructures/repositories/cart.repository.interface';
import { CartMapper } from '../../domains/mappers/cart.mapper';

@Injectable()
export class ClearCartUseCase {
  constructor(
    @Inject(CART_REPOSITORY_TOKEN)
    private readonly cartRepository: ICartRepository,
  ) {}

  async execute(userId: string): Promise<CartResponseDto> {
    const cart = await this.cartRepository.findByUserId(userId);
    if (!cart) {
      throw new NotFoundException('Keranjang belanja tidak ditemukan.');
    }

    // Hapus semua item di DB secara langsung (efisien, tanpa load entity per item)
    await this.cartRepository.clearItems(cart.id);

    // Kosongkan items di memory agar response langsung akurat
    cart.clearItems();

    return CartMapper.toResponse(cart);
  }
}