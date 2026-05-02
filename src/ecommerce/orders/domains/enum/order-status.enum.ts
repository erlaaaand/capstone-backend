export enum OrderStatus {
  /**
   * Order baru dibuat, menunggu pembayaran dari pembeli
   */
  PENDING_PAYMENT = 'PENDING_PAYMENT',

  /**
   * Pembayaran telah dikonfirmasi, order sedang diproses penjual
   */
  PROCESSING = 'PROCESSING',

  /**
   * Produk sedang dalam pengiriman
   */
  SHIPPED = 'SHIPPED',

  /**
   * Produk telah sampai dan diterima pembeli
   */
  DELIVERED = 'DELIVERED',

  /**
   * Order selesai dan ditutup (setelah konfirmasi penerimaan)
   */
  COMPLETED = 'COMPLETED',

  /**
   * Order dibatalkan (bisa oleh pembeli atau penjual)
   */
  CANCELLED = 'CANCELLED',
}