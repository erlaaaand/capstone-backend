// src/predictions/infrastructures/repositories/prediction.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
      where: { id },
      relations: ['user'],
    });
  }

  async findAllByUserId(userId: string): Promise<PredictionEntity[]> {
    return this.ormRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * FIX [INFO-03]: Implementasi findAllByUserIdPaginated menggunakan
   * TypeORM findAndCount untuk efisiensi — satu query yang mengembalikan
   * data DAN total count sekaligus, tanpa memuat seluruh tabel ke memori.
   *
   * @param userId  - UUID pemilik prediksi
   * @param skip    - jumlah record yang dilewati (offset)
   * @param limit   - jumlah record yang diambil per halaman
   * @returns       - tuple [data[], totalCount]
   */
  async findAllByUserIdPaginated(
    userId: string,
    skip: number,
    limit: number,
  ): Promise<[PredictionEntity[], number]> {
    return this.ormRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });
  }

  async create(data: Partial<PredictionEntity>): Promise<PredictionEntity> {
    const prediction = this.ormRepo.create(data);
    return this.ormRepo.save(prediction);
  }

  async updateResult(
    id: string,
    result: PredictionResultPayload,
  ): Promise<PredictionEntity> {
    await this.ormRepo.update(id, {
      varietyCode: result.varietyCode,
      varietyName: result.varietyName,
      localName: result.localName,
      origin: result.origin,
      description: result.description,
      confidenceScore: result.confidenceScore,
      imageEnhanced: result.imageEnhanced,
      inferenceTimeMs: result.inferenceTimeMs,
      status: PredictionStatus.SUCCESS,
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
      status: PredictionStatus.FAILED,
      errorMessage: reason,
    });
  }
}
