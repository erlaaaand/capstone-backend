import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { OrderEntity } from './order.entity';

@Entity({ name: 'order_items' })
export class OrderItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string = '';

  @ManyToOne(() => OrderEntity, (order) => order.items, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'orderId' })
  order: OrderEntity = new OrderEntity();

  @Column({ type: 'uuid', nullable: false })
  orderId: string = '';

  @Column({ type: 'uuid', nullable: false, comment: 'Snapshot referensi ke products.id' })
  productId: string = '';

  @Column({ type: 'varchar', length: 255, nullable: false, comment: 'Nama produk saat order dibuat (snapshot)' })
  productName: string = '';

  @Column({ type: 'varchar', length: 50, nullable: false, comment: 'Kode varietas saat order dibuat (snapshot)' })
  productVariety: string = '';

  @Column({ type: 'int', nullable: false })
  quantity: number = 0;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: false,
    comment: 'Harga per unit saat order dibuat (price snapshot)',
  })
  pricePerUnit: number = 0;

  @Column({
    type: 'decimal',
    precision: 14,
    scale: 2,
    nullable: false,
    comment: 'Subtotal = pricePerUnit × quantity',
  })
  subtotal: number = 0;

  @BeforeInsert()
  generateUuid(): void {
    if (!this.id) {
      this.id = uuidv4();
    }
  }

  // --- DOMAIN BEHAVIOR ---

  public calculateSubtotal(): number {
    return Number(this.pricePerUnit) * this.quantity;
  }
}