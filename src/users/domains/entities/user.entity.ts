// src/users/domains/entities/user.entity.ts
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PredictionEntity } from '../../../predictions/domains/entities/prediction.entity';

@Entity({ name: 'users' })
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string = '';

  @Column({ type: 'varchar', length: 255, unique: true, nullable: false })
  email: string = '';

  @Column({ type: 'varchar', length: 255, nullable: false, select: false })
  password: string = '';

  @Column({ type: 'varchar', length: 100, nullable: true })
  fullName: string | null = null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean = true;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date = new Date();

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date = new Date();

  // ── Relations ────────────────────────────────────────────────
  @OneToMany(() => PredictionEntity, (prediction) => prediction.user, {
    cascade: true,
    lazy: true,
  })
  predictions: Promise<PredictionEntity[]> = Promise.resolve([]);
}
