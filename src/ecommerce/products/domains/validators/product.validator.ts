import { ProductEntity } from '../entities/product.entity';
import { ProductStatus } from '../enums/product-status.enum';

export class ProductValidator {
  /**
   * Validasi menyeluruh sebelum produk disimpan ke database
   */
  public static validateForCreation(product: Partial<ProductEntity>): void {
    if (product.price !== undefined && product.price < 0) {
      throw new Error('Harga produk tidak boleh negatif.');
    }

    if (product.stock !== undefined && product.stock < 0) {
      throw new Error('Stok awal produk tidak boleh kurang dari nol.');
    }

    if (product.weightInGrams !== undefined && product.weightInGrams <= 0) {
      throw new Error('Berat durian harus lebih dari 0 gram.');
    }

    if (product.status === ProductStatus.AVAILABLE && product.stock === 0) {
      throw new Error('Produk dengan status AVAILABLE harus memiliki stok lebih dari 0.');
    }
  }
}