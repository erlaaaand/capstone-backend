import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { ProductVariety } from '../enums/product-variety.enum';
import { ProductStatus } from '../enums/product-status.enum';
import { VARIETY_MAP, VarietyDetails } from '../constants/variety-info.constant';

@Entity({ name: 'products' })
export class ProductEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string = '';

  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string = '';

  @Column({ type: 'text', nullable: true })
  description: string = '';

  @Column({ type: 'enum', enum: ProductVariety, nullable: false })
  variety: ProductVariety = ProductVariety.D2;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  price: number = 0;

  @Column({ type: 'int', default: 0 })
  stock: number = 0;

  @Column({ type: 'int', comment: 'Berat dalam satuan gram' })
  weightInGrams: number = 0;

  @Column({ type: 'varchar', length: 255, nullable: true })
  imageUrl: string | null = null;

  @Column({ type: 'enum', enum: ProductStatus, default: ProductStatus.DRAFT })
  status: ProductStatus = ProductStatus.DRAFT;

  @Column({ type: 'uuid', nullable: true, comment: 'ID relasi ke hasil deteksi AI' })
  predictionId: string | null = null;

  @Column({ type: 'uuid', nullable: false, comment: 'ID user penjual/admin' })
  createdById: string = '';

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

  public getVarietyDetails(): VarietyDetails {
    return VARIETY_MAP[this.variety];
  }

  public decreaseStock(quantity: number): void {
    if (this.stock < quantity) {
      throw new Error('Stok durian tidak mencukupi untuk transaksi ini.');
    }
    this.stock -= quantity;
    if (this.stock === 0) {
      this.status = ProductStatus.OUT_OF_STOCK;
    }
  }

  public increaseStock(quantity: number): void {
    this.stock += quantity;
    if (this.stock > 0 && this.status === ProductStatus.OUT_OF_STOCK) {
      this.status = ProductStatus.AVAILABLE;
    }
  }

  public markAsAvailable(): void {
    if (this.stock <= 0) {
      throw new Error('Tidak bisa mengubah status menjadi AVAILABLE karena stok kosong.');
    }
    if (!this.predictionId) {
      throw new Error('Produk premium wajib diverifikasi AI sebelum ditayangkan.');
    }
    this.status = ProductStatus.AVAILABLE;
  }
}