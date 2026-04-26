import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CartEntity } from '../../domains/entities/cart.entity';
import { CartItemEntity } from '../../domains/entities/cart-item.entity';
import { ICartRepository } from './cart.repository.interface';

@Injectable()
export class CartRepository implements ICartRepository {
  constructor(
    @InjectRepository(CartEntity)
    private readonly cartOrmRepo: Repository<CartEntity>,
    @InjectRepository(CartItemEntity)
    private readonly cartItemOrmRepo: Repository<CartItemEntity>,
  ) {}

  async findOrCreateByUserId(userId: string): Promise<CartEntity> {
    let cart = await this.cartOrmRepo.findOne({
      where: { userId },
      relations: ['items'],
    });

    if (!cart) {
      cart = this.cartOrmRepo.create({ userId, items: [] });
      cart = await this.cartOrmRepo.save(cart);
    }

    return cart;
  }

  async findByUserId(userId: string): Promise<CartEntity | null> {
    return this.cartOrmRepo.findOne({
      where: { userId },
      relations: ['items'],
    });
  }

  async save(cart: CartEntity): Promise<CartEntity> {
    return this.cartOrmRepo.save(cart);
  }

  async clearItems(cartId: string): Promise<void> {
    await this.cartItemOrmRepo.delete({ cartId });
  }
}