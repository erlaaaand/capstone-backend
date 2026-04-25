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
    return this.ormRepo.findOne({ where: { id } });
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

  async create(data: Partial<PredictionEntity>): Promise<PredictionEntity> {
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
      varietyCode:     result.varietyCode,
      varietyName:     result.varietyName,
      localName:       result.localName,
      origin:          result.origin,
      description:     result.description,
      confidenceScore: result.confidenceScore,
      imageEnhanced:   result.imageEnhanced,
      inferenceTimeMs: result.inferenceTimeMs,
      // ── BARU ──
      allVarieties:    result.allVarieties,
      modelVersion:    result.modelVersion,
      aiRequestId:     result.aiRequestId,
      status:          PredictionStatus.SUCCESS,
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
    const result = await this.ormRepo.update(id, {
      status:       PredictionStatus.FAILED,
      errorMessage: reason,
    });

    if (result.affected === 0) {
      console.warn(
        `[PredictionRepository] markAsFailed: id='${id}' tidak ditemukan ` +
          `(0 rows affected). reason='${reason}'`,
      );
    }
  }
}
