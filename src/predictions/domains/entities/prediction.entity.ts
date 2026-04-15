// src/predictions/domains/entities/prediction.entity.ts
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { UserEntity } from '../../../users/domains/entities/user.entity';

export enum PredictionStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED  = 'FAILED',
}

@Entity({ name: 'predictions' })
export class PredictionEntity {
  /**
   * FIX [BUG — Empty UUID]:
   * TypeORM hasId() tidak mendeteksi empty string sebagai "tidak ada ID".
   * @BeforeInsert memastikan UUID selalu di-generate sebelum INSERT.
   */
  @PrimaryGeneratedColumn('uuid')
  id: string = '';

  @BeforeInsert()
  generateId(): void {
    if (!this.id || this.id.trim().length === 0) {
      this.id = uuidv4();
    }
  }

  // ── Foreign Key ──────────────────────────────────────────────
  @Column({ type: 'varchar', length: 36, nullable: false })
  userId: string = '';

  // ── AI Result — Core ─────────────────────────────────────────
  @Column({ type: 'varchar', length: 100, nullable: true })
  varietyCode: string | null = null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  varietyName: string | null = null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  localName: string | null = null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  origin: string | null = null;

  @Column({ type: 'text', nullable: true })
  description: string | null = null;

  @Column({ type: 'decimal', precision: 5, scale: 4, nullable: true })
  confidenceScore: number | null = null;

  // ── AI Result — Metadata ─────────────────────────────────────
  @Column({ type: 'boolean', nullable: true, default: null })
  imageEnhanced: boolean | null = null;

  @Column({ type: 'float', nullable: true, default: null })
  inferenceTimeMs: number | null = null;

  // ── Image Storage ────────────────────────────────────────────
  @Column({ type: 'varchar', length: 512, nullable: false })
  imageUrl: string = '';

  // ── Status Tracking ──────────────────────────────────────────
  @Column({
    type:    'enum',
    enum:    PredictionStatus,
    default: PredictionStatus.PENDING,
  })
  status: PredictionStatus = PredictionStatus.PENDING;

  @Column({ type: 'text', nullable: true })
  errorMessage: string | null = null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date = new Date();

  // ── Relations ────────────────────────────────────────────────
  @ManyToOne(() => UserEntity, (user) => user.predictions, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;
}