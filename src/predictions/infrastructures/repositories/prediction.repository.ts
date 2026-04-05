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
      confidenceScore: result.confidenceScore,
      status: PredictionStatus.SUCCESS,
    });

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error(`Prediction id '${id}' tidak ditemukan setelah update`);
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
