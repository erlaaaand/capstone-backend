// src/predictions/infrastructures/repositories/prediction.repository.interface.ts
import { PredictionEntity } from '../../domains/entities/prediction.entity';

// ── BARU: tipe data untuk satu entri all_varieties yang disimpan di DB ──
export interface VarietyScoreData {
  varietyCode: string;
  varietyName: string;
  confidenceScore: number;
}

export interface PredictionResultPayload {
  varietyCode:     string;
  varietyName:     string;
  localName:       string;
  origin:          string;
  description:     string;
  confidenceScore: number;
  imageEnhanced:   boolean;
  inferenceTimeMs: number;
  // ── BARU ──
  allVarieties:    VarietyScoreData[];
  modelVersion:    string | null;
  aiRequestId:     string | null;
}

export interface IPredictionRepository {
  findById(id: string): Promise<PredictionEntity | null>;
  findAllByUserId(userId: string): Promise<PredictionEntity[]>;
  findAllByUserIdPaginated(
    userId: string,
    skip: number,
    limit: number,
  ): Promise<[PredictionEntity[], number]>;
  create(data: Partial<PredictionEntity>): Promise<PredictionEntity>;
  updateResult(id: string, result: PredictionResultPayload): Promise<PredictionEntity>;
  markAsFailed(id: string, reason: string): Promise<void>;
}

export const PREDICTION_REPOSITORY_TOKEN = Symbol('IPredictionRepository');
