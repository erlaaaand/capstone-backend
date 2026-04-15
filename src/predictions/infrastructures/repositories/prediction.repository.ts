// src/predictions/infrastructures/repositories/prediction.repository.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import {
  PredictionEntity,
  PredictionStatus,
} from '../../domains/entities/prediction.entity';
import {
  IPredictionRepository,
  PredictionResultPayload,
} from './prediction.repository.interface';

@Injectable()
export class PredictionRepository implements IPredictionRepository {
  constructor(
    @InjectRepository(PredictionEntity)
    private readonly ormRepo: Repository<PredictionEntity>,
  ) {}

  async findById(id: string): Promise<PredictionEntity | null> {
    return this.ormRepo.findOne({
      where:     { id },
      relations: ['user'],
    });
  }

  async findAllByUserId(userId: string): Promise<PredictionEntity[]> {
    return this.ormRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findAllByUserIdPaginated(
    userId: string,
    skip:   number,
    limit:  number,
  ): Promise<[PredictionEntity[], number]> {
    return this.ormRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });
  }

  /**
   * FIX [BUG — userId selalu "" di INSERT]:
   *
   * MASALAH:
   *   `ormRepo.create(data)` + `ormRepo.save(entity)` memiliki bug tersembunyi:
   *   TypeORM membaca nilai FK userId dari `entity.user.id` (relasi object),
   *   bukan dari `entity.userId` (property langsung).
   *
   *   Karena PredictionEntity punya KEDUA:
   *     @Column userId: string = ''           ← property FK
   *     @ManyToOne @JoinColumn({ name: 'userId' }) user!: UserEntity  ← relasi
   *
   *   Dan entity baru tidak punya `user` yang di-load, TypeORM menggunakan
   *   nilai default `''` untuk kolom userId saat INSERT.
   *
   * SOLUSI:
   *   Gunakan `createQueryBuilder().insert()` yang LANGSUNG memetakan
   *   nilai kolom tanpa melalui logika relasi TypeORM.
   *   Ini memastikan userId yang diberikan benar-benar masuk ke DB.
   *
   *   Setelah INSERT, lakukan SELECT untuk mendapatkan entity lengkap
   *   dengan semua field (termasuk createdAt yang di-generate DB).
   */
  async create(data: Partial<PredictionEntity>): Promise<PredictionEntity> {
    // ── Validasi wajib sebelum menyentuh DB ─────────────────────────────
    if (!data.userId || data.userId.trim().length === 0) {
      throw new InternalServerErrorException(
        'Tidak dapat membuat prediction: userId kosong. ' +
          'Pastikan JWT token valid dan JwtStrategy.validate() ' +
          'mengembalikan { sub: uuid, email: "..." }.',
      );
    }

    if (!data.imageUrl || data.imageUrl.trim().length === 0) {
      throw new InternalServerErrorException(
        'Tidak dapat membuat prediction: imageUrl kosong.',
      );
    }

    const id     = uuidv4();
    const userId = data.userId.trim();

    /**
     * Gunakan queryBuilder insert() — bypass ORM entity resolution.
     *
     * Perbedaan dengan save():
     * - save() → TypeORM resolve relasi, baca userId dari entity.user.id
     * - insert() → TypeORM langsung tulis nilai kolom yang diberikan
     *
     * Ini adalah solusi yang paling reliable untuk kasus di mana
     * ada konflik antara @Column dan @ManyToOne pada kolom FK yang sama.
     */
    await this.ormRepo
      .createQueryBuilder()
      .insert()
      .into(PredictionEntity)
      .values({
        id,
        userId,
        imageUrl: data.imageUrl.trim(),
        status:   PredictionStatus.PENDING,
      })
      .execute();

    // SELECT untuk mendapatkan entity lengkap dengan field DB-generated (createdAt)
    const created = await this.ormRepo.findOne({ where: { id } });

    if (!created) {
      throw new InternalServerErrorException(
        `Prediction berhasil di-INSERT tapi tidak ditemukan saat SELECT. id=${id}`,
      );
    }

    return created;
  }

  async updateResult(
    id:     string,
    result: PredictionResultPayload,
  ): Promise<PredictionEntity> {
    await this.ormRepo.update(id, {
      varietyCode:    result.varietyCode,
      varietyName:    result.varietyName,
      localName:      result.localName,
      origin:         result.origin,
      description:    result.description,
      confidenceScore: result.confidenceScore,
      imageEnhanced:  result.imageEnhanced,
      inferenceTimeMs: result.inferenceTimeMs,
      status:         PredictionStatus.SUCCESS,
    });

    const updated = await this.findById(id);

    if (!updated) {
      throw new Error(
        `Prediction id '${id}' tidak ditemukan setelah updateResult.`,
      );
    }

    return updated;
  }

  async markAsFailed(id: string, reason: string): Promise<void> {
    await this.ormRepo.update(id, {
      status:       PredictionStatus.FAILED,
      errorMessage: reason,
    });
  }
}