import { CartEntity } from '../../../carts/domains/entities/cart.entity';
import { CartValidator } from '../../../carts/domains/validators/cart.validator';

export class OrderValidator {
  /**
   * Validasi keranjang layak untuk di-checkout
   */
  public static validateCartForCheckout(cart: CartEntity): void {
    CartValidator.validateCartNotEmpty(cart);
  }

  /**
   * Validasi data pengiriman wajib ada sebelum order dibuat
   */
  public static validateShippingData(
    recipientName: string | undefined,
    shippingAddress: string | undefined,
    recipientPhone: string | undefined,
  ): void {
    if (!recipientName || recipientName.trim() === '') {
      throw new Error('Nama penerima wajib diisi.');
    }
    if (!shippingAddress || shippingAddress.trim() === '') {
      throw new Error('Alamat pengiriman wajib diisi.');
    }
    if (!recipientPhone || recipientPhone.trim() === '') {
      throw new Error('Nomor telepon penerima wajib diisi.');
    }
  }

  /**
   * Validasi total order tidak boleh nol
   */
  public static validateOrderTotal(totalAmount: number): void {
    if (totalAmount <= 0) {
      throw new Error('Total order harus lebih dari Rp 0.');
    }
  }
}