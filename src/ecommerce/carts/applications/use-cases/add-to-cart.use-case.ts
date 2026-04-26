import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AddToCartDto } from '../dto/add-to-cart.dto';
import { CartResponseDto } from '../dto/cart-response.dto';
import { type ICartRepository, CART_REPOSITORY_TOKEN } from '../../infrastructures/repositories/cart.repository.interface';
import { PRODUCT_REPOSITORY_TOKEN, type IProductRepository } from '../../../products/infrastructures/repositories/product.repository.interface';
import { CartDomainService } from '../../domains/services/cart-domain.service';
import { CartMapper } from '../../domains/mappers/cart.mapper';
import { CartCreatedEvent } from '../../infrastructures/events/cart-created.events';
import { ProductStatus } from '../../../products/domains/enums/product-status.enum';

@Injectable()
export class AddToCartUseCase {
  constructor(
    @Inject(CART_REPOSITORY_TOKEN)
    private readonly cartRepository: ICartRepository,
    @Inject(PRODUCT_REPOSITORY_TOKEN)
    private readonly productRepository: IProductRepository,
    private readonly cartDomainService: CartDomainService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(userId: string, dto: AddToCartDto): Promise<CartResponseDto> {
    // 1. Validasi produk ada dan berstatus AVAILABLE
    const product = await this.productRepository.findById(dto.productId);
    if (!product) {
      throw new NotFoundException(`Produk dengan ID "${dto.productId}" tidak ditemukan.`);
    }
    if (product.status !== ProductStatus.AVAILABLE) {
      throw new UnprocessableEntityException(
        `Produk "${product.name}" sedang tidak tersedia untuk dibeli.`,
      );
    }

    // 2. Get or create keranjang user
    const isNew = !(await this.cartRepository.findByUserId(userId));
    const cart = await this.cartRepository.findOrCreateByUserId(userId);

    // 3. Jalankan domain rules (cek batas item & stok)
    try {
      if (!cart.findItemByProductId(dto.productId)) {
        this.cartDomainService.validateCartItemLimit(cart);
      }
      this.cartDomainService.validateAddToCart(
        cart,
        dto.productId,
        dto.quantity,
        product.stock,
        product.name,
      );
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }

    // 4. Tambahkan item ke entity (domain behavior)
    cart.addItem(dto.productId, dto.quantity, product.price);

    // 5. Simpan
    const saved = await this.cartRepository.save(cart);

    // 6. Emit event jika keranjang baru dibuat
    if (isNew) {
      this.eventEmitter.emit(
        'cart.created',
        new CartCreatedEvent(saved.id, userId, saved.createdAt),
      );
    }

    return CartMapper.toResponse(saved);
  }
}