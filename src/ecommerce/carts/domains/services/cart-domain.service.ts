import { Injectable } from '@nestjs/common';
import { CartEntity } from '../entities/cart.entity';
import { CartValidator } from '../validators/cart.validator';

@Injectable()
export class CartDomainService {
  /**
   * Aturan Bisnis: Memastikan total item dalam keranjang satu user
   * tidak melampaui batas maksimum yang diizinkan.
   */
  public validateCartItemLimit(cart: CartEntity, maxItems: number = 20): void {
    if (cart.items.length >= maxItems) {
      throw new Error(
        `Keranjang belanja sudah mencapai batas maksimum ${maxItems} jenis produk.`,
      );
    }
  }

  /**
   * Aturan Bisnis: Memvalidasi ketersediaan stok sebelum menambah/mengubah item.
   * Memperhitungkan quantity yang sudah ada di keranjang untuk produk yang sama.
   */
  public validateAddToCart(
    cart: CartEntity,
    productId: string,
    requestedQuantity: number,
    availableStock: number,
    productName: string,
  ): void {
    CartValidator.validateQuantityIsPositive(requestedQuantity);

    const existingItem = cart.findItemByProductId(productId);
    const alreadyInCart = existingItem ? existingItem.quantity : 0;
    const totalRequested = alreadyInCart + requestedQuantity;

    CartValidator.validateStockAvailability(totalRequested, availableStock, productName);
  }

  /**
   * Aturan Bisnis: Memvalidasi pembaruan quantity item yang sudah ada.
   */
  public validateUpdateCartItem(
    newQuantity: number,
    availableStock: number,
    productName: string,
  ): void {
    CartValidator.validateQuantityIsPositive(newQuantity);
    CartValidator.validateStockAvailability(newQuantity, availableStock, productName);
  }
}