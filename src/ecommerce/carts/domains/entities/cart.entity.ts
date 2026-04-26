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
import { CartItemEntity } from './cart-item.entity';

@Entity({ name: 'carts' })
export class CartEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string = '';

  @Column({ type: 'uuid', nullable: false, unique: true, comment: 'ID user pemilik keranjang' })
  userId: string = '';

  @OneToMany(() => CartItemEntity, (item) => item.cart, {
    cascade: true,
    eager: true,
  })
  items: CartItemEntity[] = [];

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

  // --- BUSINESS RULES / DOMAIN BEHAVIORS ---

  /**
   * Menghitung total harga keseluruhan isi keranjang
   */
  public calculateTotalPrice(): number {
    return this.items.reduce((total, item) => total + item.calculateSubtotal(), 0);
  }

  /**
   * Menghitung total jumlah item (quantity) dalam keranjang
   */
  public calculateTotalItems(): number {
    return this.items.reduce((total, item) => total + item.quantity, 0);
  }

  /**
   * Mencari item berdasarkan productId
   */
  public findItemByProductId(productId: string): CartItemEntity | undefined {
    return this.items.find((item) => item.productId === productId);
  }

  /**
   * Menambahkan item baru atau menambah quantity jika produk sudah ada
   */
  public addItem(productId: string, quantity: number, priceAtAdded: number): void {
    const existing = this.findItemByProductId(productId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      const newItem = new CartItemEntity();
      newItem.id = uuidv4();
      newItem.productId = productId;
      newItem.quantity = quantity;
      newItem.priceAtAdded = priceAtAdded;
      newItem.cart = this;
      this.items.push(newItem);
    }
  }

  /**
   * Mengubah quantity item; jika quantity <= 0, item dihapus
   */
  public updateItemQuantity(productId: string, quantity: number): void {
    const index = this.items.findIndex((item) => item.productId === productId);
    if (index === -1) {
      throw new Error(`Item dengan produk ID "${productId}" tidak ada di keranjang.`);
    }
    if (quantity <= 0) {
      this.items.splice(index, 1);
    } else {
      this.items[index].quantity = quantity;
    }
  }

  /**
   * Menghapus satu item dari keranjang
   */
  public removeItem(productId: string): void {
    const index = this.items.findIndex((item) => item.productId === productId);
    if (index === -1) {
      throw new Error(`Item dengan produk ID "${productId}" tidak ada di keranjang.`);
    }
    this.items.splice(index, 1);
  }

  /**
   * Mengosongkan seluruh isi keranjang
   */
  public clearItems(): void {
    this.items = [];
  }
}