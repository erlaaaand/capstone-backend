// src/predictions/domains/services/prediction-domain.service.ts
import { Injectable } from '@nestjs/common';
import { PredictionStatus } from '../entities/prediction.entity';

export interface PredictionSummary {
  total: number;
  success: number;
  failed: number;
  pending: number;
  averageConfidence: number | null;
}

@Injectable()
export class PredictionDomainService {
  buildSummary(
    predictions: { status: PredictionStatus; confidenceScore: number | null }[],
  ): PredictionSummary {
    const total = predictions.length;
    const success = predictions.filter(
      (p) => p.status === PredictionStatus.SUCCESS,
    ).length;
    const failed = predictions.filter(
      (p) => p.status === PredictionStatus.FAILED,
    ).length;
    const pending = predictions.filter(
      (p) => p.status === PredictionStatus.PENDING,
    ).length;

    const scores = predictions
      .map((p) => p.confidenceScore)
      .filter((s): s is number => s !== null);

    const averageConfidence =
      scores.length > 0
        ? scores.reduce((acc, s) => acc + s, 0) / scores.length
        : null;

    return { total, success, failed, pending, averageConfidence };
  }

  formatConfidenceScore(score: number): string {
    return `${(score * 100).toFixed(2)}%`;
  }
}
