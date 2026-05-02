import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  BeforeInsert,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { OrderItemEntity } from './order-item.entity';
import { OrderStatus } from '../enum/order-status.enum';
import { PaymentStatus } from '../enum/payment-status.enum';

@Entity({ name: 'orders' })
export class OrderEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string = '';

  @Column({ type: 'uuid', nullable: false, comment: 'ID user pembeli' })
  userId: string = '';

  @OneToMany(() => OrderItemEntity, (item) => item.order, {
    cascade: true,
    eager: true,
  })
  items: OrderItemEntity[] = [];

  @Column({
    type: 'decimal',
    precision: 14,
    scale: 2,
    nullable: false,
    comment: 'Total harga keseluruhan order',
  })
  totalAmount: number = 0;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING_PAYMENT })
  status: OrderStatus = OrderStatus.PENDING_PAYMENT;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.UNPAID })
  paymentStatus: PaymentStatus = PaymentStatus.UNPAID;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: 'Nama penerima paket' })
  recipientName: string | null = null;

  @Column({ type: 'text', nullable: true, comment: 'Alamat pengiriman lengkap' })
  shippingAddress: string | null = null;

  @Column({ type: 'varchar', length: 20, nullable: true, comment: 'Nomor telepon penerima' })
  recipientPhone: string | null = null;

  @Column({ type: 'text', nullable: true, comment: 'Catatan tambahan dari pembeli' })
  notes: string | null = null;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: 'Nomor resi pengiriman' })
  trackingNumber: string | null = null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date = new Date();

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date = new Date();

  @BeforeInsert()
  generateUuid(): void {
    if (!this.id) {
      this.id = uuidv4();
    }
  }

  // =========================================================
  // DOMAIN BEHAVIORS — Order State Machine
  // =========================================================

  /**
   * Menghitung ulang total amount dari semua items
   */
  public recalculateTotalAmount(): void {
    this.totalAmount = this.items.reduce((sum, item) => sum + Number(item.subtotal), 0);
  }

  /**
   * Konfirmasi pembayaran → PENDING_PAYMENT + UNPAID → PROCESSING + PAID
   */
  public confirmPayment(): void {
    if (this.status !== OrderStatus.PENDING_PAYMENT) {
      throw new Error(
        `Gagal konfirmasi pembayaran. Order berstatus "${this.status}", bukan PENDING_PAYMENT.`,
      );
    }
    if (this.paymentStatus === PaymentStatus.PAID) {
      throw new Error('Pembayaran untuk order ini sudah dikonfirmasi sebelumnya.');
    }
    this.paymentStatus = PaymentStatus.PAID;
    this.status = OrderStatus.PROCESSING;
  }

  /**
   * Kirim order → PROCESSING → SHIPPED (wajib sertakan nomor resi)
   */
  public shipOrder(trackingNumber: string): void {
    if (this.status !== OrderStatus.PROCESSING) {
      throw new Error(
        `Gagal mengirim order. Order berstatus "${this.status}", bukan PROCESSING.`,
      );
    }
    if (!trackingNumber || trackingNumber.trim() === '') {
      throw new Error('Nomor resi pengiriman wajib diisi saat mengubah status ke SHIPPED.');
    }
    this.trackingNumber = trackingNumber.trim();
    this.status = OrderStatus.SHIPPED;
  }

  /**
   * Tandai sudah diterima → SHIPPED → DELIVERED
   */
  public markAsDelivered(): void {
    if (this.status !== OrderStatus.SHIPPED) {
      throw new Error(
        `Gagal menandai order diterima. Order berstatus "${this.status}", bukan SHIPPED.`,
      );
    }
    this.status = OrderStatus.DELIVERED;
  }

  /**
   * Selesaikan order → DELIVERED → COMPLETED
   */
  public completeOrder(): void {
    if (this.status !== OrderStatus.DELIVERED) {
      throw new Error(
        `Gagal menyelesaikan order. Order berstatus "${this.status}", bukan DELIVERED.`,
      );
    }
    this.status = OrderStatus.COMPLETED;
  }

  /**
   * Batalkan order — hanya bisa dari PENDING_PAYMENT atau PROCESSING
   */
  public cancelOrder(): void {
    const cancellableStatuses: OrderStatus[] = [
      OrderStatus.PENDING_PAYMENT,
      OrderStatus.PROCESSING,
    ];
    if (!cancellableStatuses.includes(this.status)) {
      throw new Error(
        `Order dengan status "${this.status}" tidak dapat dibatalkan. ` +
        `Pembatalan hanya diperbolehkan pada status PENDING_PAYMENT atau PROCESSING.`,
      );
    }
    this.status = OrderStatus.CANCELLED;

    // Jika sudah terbayar, tandai perlu refund
    if (this.paymentStatus === PaymentStatus.PAID) {
      this.paymentStatus = PaymentStatus.REFUNDED;
    }
  }

  /**
   * Helper: apakah order masih bisa dimodifikasi
   */
  public isModifiable(): boolean {
    return this.status === OrderStatus.PENDING_PAYMENT;
  }
}