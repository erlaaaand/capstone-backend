// src/predictions/infrastructures/repositories/prediction.repository.interface.ts
import { PredictionEntity } from '../../domains/entities/prediction.entity';

export interface IPredictionRepository {
  findById(id: string): Promise<PredictionEntity | null>;
  findAllByUserId(userId: string): Promise<PredictionEntity[]>;
  create(data: Partial<PredictionEntity>): Promise<PredictionEntity>;
  updateResult(
    id: string,
    result: PredictionResultPayload,
  ): Promise<PredictionEntity>;
  markAsFailed(id: string, reason: string): Promise<void>;
}

export interface PredictionResultPayload {
  varietyCode: string;
  confidenceScore: number;
}

export const PREDICTION_REPOSITORY_TOKEN = Symbol('IPredictionRepository');
