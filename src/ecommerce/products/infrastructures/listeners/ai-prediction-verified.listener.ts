import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ProductCreatedEvent } from '../events/product-created.event';

@Injectable()
export class AiPredictionVerifiedListener {
  private readonly logger = new Logger(AiPredictionVerifiedListener.name);

  @OnEvent('product.created')
  handleProductCreatedEvent(event: ProductCreatedEvent): void {
    this.logger.log(
      `[EVENT] Produk baru dibuat: "${event.productName}" (ID: ${event.productId}) ` +
      `varietas ${event.variety} oleh user ${event.createdById} pada ${event.createdAt.toISOString()}`,
    );
    // Di sini bisa diintegrasikan: kirim notifikasi, update analytics, dsb.
  }
}