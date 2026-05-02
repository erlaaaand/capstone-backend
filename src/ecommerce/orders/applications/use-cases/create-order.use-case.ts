import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateOrderDto } from '../dto/create-order.dto';
import { OrderResponseDto } from '../dto/order-response.dto';
import { type IOrderRepository, ORDER_REPOSITORY_TOKEN } from '../../infrastructures/repositories/order.repository.interface';
import { CART_REPOSITORY_TOKEN, type ICartRepository } from '../../../carts/infrastructures/repositories/cart.repository.interface';
import { PRODUCT_REPOSITORY_TOKEN, type IProductRepository } from '../../../products/infrastructures/repositories/product.repository.interface';
import { OrderValidator } from '../../domains/validators/order.validator';
import { OrderMapper } from '../../domains/mappers/order.mapper';
import { OrderItemEntity } from '../../domains/entities/order-item.entity';
import { OrderCreatedEvent } from '../../infrastructures/events/order-created.event';
import { ProductStatus } from '../../../products/domains/enums/product-status.enum';

@Injectable()
export class CreateOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY_TOKEN)
    private readonly orderRepository: IOrderRepository,
    @Inject(CART_REPOSITORY_TOKEN)
    private readonly cartRepository: ICartRepository,
    @Inject(PRODUCT_REPOSITORY_TOKEN)
    private readonly productRepository: IProductRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(userId: string, dto: CreateOrderDto): Promise<OrderResponseDto> {
    // 1. Ambil keranjang user, pastikan tidak kosong
    const cart = await this.cartRepository.findByUserId(userId);
    if (!cart) {
      throw new NotFoundException('Keranjang belanja tidak ditemukan. Tambahkan produk terlebih dahulu.');
    }

    try {
      OrderValidator.validateCartForCheckout(cart);
      OrderValidator.validateShippingData(dto.recipientName, dto.shippingAddress, dto.recipientPhone);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }

    // 2. Validasi setiap produk masih AVAILABLE & stok mencukupi
    //    Sekaligus bangun order items dengan price snapshot
    const orderItems: Partial<OrderItemEntity>[] = [];
    let totalAmount = 0;

    for (const cartItem of cart.items) {
      const product = await this.productRepository.findById(cartItem.productId);

      if (!product) {
        throw new UnprocessableEntityException(
          `Produk dengan ID "${cartItem.productId}" tidak lagi tersedia. Hapus dari keranjang dan coba lagi.`,
        );
      }

      if (product.status !== ProductStatus.AVAILABLE) {
        throw new UnprocessableEntityException(
          `Produk "${product.name}" sudah tidak tersedia untuk dibeli. Hapus dari keranjang dan coba lagi.`,
        );
      }

      if (product.stock < cartItem.quantity) {
        throw new UnprocessableEntityException(
          `Stok durian "${product.name}" tidak mencukupi. ` +
          `Diminta: ${cartItem.quantity}, tersedia: ${product.stock}.`,
        );
      }

      const subtotal = Number(cartItem.priceAtAdded) * cartItem.quantity;
      totalAmount += subtotal;

      orderItems.push({
        productId: product.id,
        productName: product.name,
        productVariety: product.variety,
        quantity: cartItem.quantity,
        pricePerUnit: Number(cartItem.priceAtAdded), // price snapshot dari cart
        subtotal,
      });
    }

    try {
      OrderValidator.validateOrderTotal(totalAmount);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }

    // 3. Deduct stok setiap produk (domain behavior pada entity)
    for (const cartItem of cart.items) {
      const product = await this.productRepository.findById(cartItem.productId);
      if (product) {
        try {
          product.decreaseStock(cartItem.quantity);
        } catch (error: any) {
          throw new UnprocessableEntityException(error.message);
        }
        await this.productRepository.update(product.id, {
          stock: product.stock,
          status: product.status,
        });
      }
    }

    // 4. Buat order baru
    const order = await this.orderRepository.create({
      userId,
      items: orderItems as OrderItemEntity[],
      totalAmount,
      recipientName: dto.recipientName,
      shippingAddress: dto.shippingAddress,
      recipientPhone: dto.recipientPhone,
      notes: dto.notes ?? null,
    });

    // 5. Kosongkan keranjang setelah checkout berhasil
    await this.cartRepository.clearItems(cart.id);

    // 6. Emit event
    this.eventEmitter.emit(
      'order.created',
      new OrderCreatedEvent(order.id, userId, order.totalAmount, order.items.length, order.createdAt),
    );

    return OrderMapper.toResponse(order);
  }
}