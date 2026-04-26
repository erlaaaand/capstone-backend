import { CartEntity } from '../../domains/entities/cart.entity';

export interface ICartRepository {
  /**
   * Mencari cart berdasarkan userId. Jika belum ada, membuat cart baru (get-or-create).
   */
  findOrCreateByUserId(userId: string): Promise<CartEntity>;

  /**
   * Mencari cart berdasarkan userId, kembalikan null jika tidak ada.
   */
  findByUserId(userId: string): Promise<CartEntity | null>;

  /**
   * Menyimpan perubahan pada cart (termasuk relasi items-nya).
   */
  save(cart: CartEntity): Promise<CartEntity>;

  /**
   * Menghapus semua item dalam cart (clear) tanpa menghapus cart-nya.
   */
  clearItems(cartId: string): Promise<void>;
}

export const CART_REPOSITORY_TOKEN = 'ICartRepository';