import { CartEntity } from '../entities/cart.entity';

export class CartValidator {
  /**
   * Validasi apakah quantity yang diminta tidak melebihi stok yang tersedia
   */
  public static validateStockAvailability(
    requestedQuantity: number,
    availableStock: number,
    productName: string,
  ): void {
    if (requestedQuantity > availableStock) {
      throw new Error(
        `Stok durian "${productName}" tidak mencukupi. ` +
        `Diminta: ${requestedQuantity}, Tersedia: ${availableStock}.`,
      );
    }
  }

  /**
   * Validasi quantity tidak boleh <= 0
   */
  public static validateQuantityIsPositive(quantity: number): void {
    if (quantity <= 0) {
      throw new Error('Jumlah item harus lebih dari 0.');
    }
  }

  /**
   * Validasi keranjang tidak kosong sebelum proses checkout
   */
  public static validateCartNotEmpty(cart: CartEntity): void {
    if (!cart.items || cart.items.length === 0) {
      throw new Error('Keranjang belanja kosong. Tambahkan produk terlebih dahulu.');
    }
  }
}