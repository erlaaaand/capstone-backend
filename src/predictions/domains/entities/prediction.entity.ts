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
  /**
   * FIX [BUG — userId selalu "" di INSERT]:
   *
   * MASALAH:
   *   Sebelumnya: `user: UserEntity = new UserEntity()`
   *
   *   TypeORM, saat membangun INSERT statement, membaca nilai FK dari
   *   RELASI OBJECT (`entity.user.id`), bukan dari property `userId`
   *   secara langsung. Karena `new UserEntity()` menghasilkan object
   *   dengan `id = ''` (class default), TypeORM memakai `''` sebagai
   *   nilai userId di INSERT — meski `entity.userId` sudah di-set benar.
   *
   *   Ini terbukti dari log:
   *     Controller log: userId=18c585b0-dc03-44df-...   ← benar
   *     INSERT params:  userId=""                        ← salah
   *
   * SOLUSI:
   *   Hapus initializer `= new UserEntity()`.
   *   Deklarasikan sebagai `user!: UserEntity` (definite assignment,
   *   tidak ada default value).
   *
   *   Dengan ini, saat TypeORM mencoba membaca `entity.user`, nilainya
   *   `undefined`. TypeORM lalu fallback ke membaca FK dari property
   *   `userId` yang sudah di-set dengan benar → INSERT memakai UUID asli.
   *
   *   `!` (non-null assertion) aman di sini karena:
   *   - TypeORM lazy-loads relasi saat dibutuhkan
   *   - Kita tidak pernah akses `entity.user` saat INSERT
   *   - Kode yang perlu akses user (misal mapper) menggunakan userId saja
   */
  @ManyToOne(() => UserEntity, (user) => user.predictions, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;
}