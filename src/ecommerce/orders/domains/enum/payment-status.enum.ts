export enum PaymentStatus {
  /**
   * Menunggu pembayaran dari pembeli
   */
  UNPAID = 'UNPAID',

  /**
   * Pembayaran sudah dilakukan, menunggu verifikasi
   */
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',

  /**
   * Pembayaran telah diverifikasi dan dikonfirmasi
   */
  PAID = 'PAID',

  /**
   * Pembayaran gagal atau ditolak
   */
  FAILED = 'FAILED',

  /**
   * Dana dikembalikan ke pembeli (akibat pembatalan setelah bayar)
   */
  REFUNDED = 'REFUNDED',
}