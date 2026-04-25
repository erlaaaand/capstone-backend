import { Injectable } from '@nestjs/common';
import { ProductVariety } from '../enums/product-variety.enum';

@Injectable()
export class ProductDomainService {
  /**
   * Aturan Bisnis Inti: Memastikan klaim varietas dari penjual
   * cocok 100% dengan hasil prediksi mesin AI.
   * * @param claimedVariety Varietas yang dipilih penjual di UI
   * @param aiPredictedClass Kelas hasil prediksi dari model AI
   */
  public validateAiPredictionMatch(
    claimedVariety: ProductVariety,
    aiPredictedClass: string,
  ): void {
    // Normalisasi string (misal AI mengembalikan 'D197', enum 'D197')
    const normalizedClaim = claimedVariety.toUpperCase();
    const normalizedPrediction = aiPredictedClass.toUpperCase();

    if (normalizedClaim !== normalizedPrediction) {
      throw new Error(
        `Gagal verifikasi AI! Anda mengklaim ini varietas ${claimedVariety}, ` +
        `namun AI mendeteksi ini sebagai varietas ${aiPredictedClass}. ` +
        `Label Premium ditolak.`
      );
    }
  }
}