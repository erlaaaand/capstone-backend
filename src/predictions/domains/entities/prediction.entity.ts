// src/predictions/domains/entities/prediction.entity.ts
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from '../../../users/domains/entities/user.entity';

export enum PredictionStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

@Entity({ name: 'predictions' })
export class PredictionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string = '';

  // ── Foreign Key ──────────────────────────────────────────────
  @Column({ type: 'varchar', length: 36, nullable: false })
  userId: string = '';

  // ── AI Result ────────────────────────────────────────────────
  @Column({ type: 'varchar', length: 100, nullable: true })
  varietyCode: string | null = null;

  @Column({ type: 'decimal', precision: 5, scale: 4, nullable: true })
  confidenceScore: number | null = null;

  // ── Image Storage ────────────────────────────────────────────
  @Column({ type: 'varchar', length: 512, nullable: false })
  imageUrl: string = '';

  // ── Status Tracking ──────────────────────────────────────────
  @Column({
    type: 'enum',
    enum: PredictionStatus,
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
  user: UserEntity = new UserEntity();
}
