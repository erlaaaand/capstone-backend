import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { CartEntity } from './cart.entity';

@Entity({ name: 'cart_items' })
export class CartItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string = '';

  @ManyToOne(() => CartEntity, (cart) => cart.items, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'cartId' })
  cart: CartEntity = new CartEntity();

  @Column({ type: 'uuid', nullable: false })
  cartId: string = '';

  @Column({ type: 'uuid', nullable: false, comment: 'Referensi ke products.id' })
  productId: string = '';

  @Column({ type: 'int', default: 1 })
  quantity: number = 1;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    comment: 'Harga produk saat item ditambahkan ke keranjang (price snapshot)',
  })
  priceAtAdded: number = 0;

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

  // --- BUSINESS RULES ---

  /**
   * Menghitung subtotal untuk item ini (priceAtAdded × quantity)
   */
  public calculateSubtotal(): number {
    return Number(this.priceAtAdded) * this.quantity;
  }
}