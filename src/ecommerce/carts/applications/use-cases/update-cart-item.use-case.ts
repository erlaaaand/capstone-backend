import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UpdateCartItemDto } from '../dto/update-cart-item.dto';
import { CartResponseDto } from '../dto/cart-response.dto';
import { type ICartRepository, CART_REPOSITORY_TOKEN } from '../../infrastructures/repositories/cart.repository.interface';
import { PRODUCT_REPOSITORY_TOKEN, type IProductRepository } from '../../../products/infrastructures/repositories/product.repository.interface';
import { CartDomainService } from '../../domains/services/cart-domain.service';
import { CartMapper } from '../../domains/mappers/cart.mapper';

@Injectable()
export class UpdateCartItemUseCase {
  constructor(
    @Inject(CART_REPOSITORY_TOKEN)
    private readonly cartRepository: ICartRepository,
    @Inject(PRODUCT_REPOSITORY_TOKEN)
    private readonly productRepository: IProductRepository,
    private readonly cartDomainService: CartDomainService,
  ) {}

  async execute(userId: string, productId: string, dto: UpdateCartItemDto): Promise<CartResponseDto> {
    const cart = await this.cartRepository.findByUserId(userId);
    if (!cart) {
      throw new NotFoundException('Keranjang belanja tidak ditemukan.');
    }

    const item = cart.findItemByProductId(productId);
    if (!item) {
      throw new NotFoundException(`Item dengan produk ID "${productId}" tidak ada di keranjang.`);
    }

    // Validasi stok terkini dari produk
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new NotFoundException(`Produk dengan ID "${productId}" tidak lagi tersedia.`);
    }

    try {
      this.cartDomainService.validateUpdateCartItem(dto.quantity, product.stock, product.name);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }

    // Update quantity melalui domain behavior
    cart.updateItemQuantity(productId, dto.quantity);

    const saved = await this.cartRepository.save(cart);
    return CartMapper.toResponse(saved);
  }
}