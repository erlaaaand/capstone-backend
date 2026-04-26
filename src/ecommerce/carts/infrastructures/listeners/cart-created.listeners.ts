import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CartCreatedEvent } from '../events/cart-created.events';

@Injectable()
export class CartCreatedListener {
  private readonly logger = new Logger(CartCreatedListener.name);

  @OnEvent('cart.created')
  handleCartCreatedEvent(event: CartCreatedEvent): void {
    this.logger.log(
      `[EVENT] Keranjang baru dibuat: ID "${event.cartId}" untuk user "${event.userId}" ` +
      `pada ${event.createdAt.toISOString()}`,
    );
    // Di sini bisa diintegrasikan: inisialisasi sesi, analitik, dsb.
  }
}