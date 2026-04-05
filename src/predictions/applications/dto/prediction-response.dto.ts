// src/predictions/applications/dto/prediction-response.dto.ts
import { PredictionStatus } from '../../domains/entities/prediction.entity';

export class PredictionResponseDto {
  id: string = '';
  userId: string = '';

  // ── AI Result — Core ─────────────────────────────────────────
  varietyCode: string | null = null;
  varietyName: string | null = null;
  localName: string | null = null;
  origin: string | null = null;
  description: string | null = null;
  confidenceScore: number | null = null;

  // ── AI Result — Metadata ─────────────────────────────────────
  imageEnhanced: boolean | null = null;
  inferenceTimeMs: number | null = null;

  // ── Image & Status ───────────────────────────────────────────
  imageUrl: string = '';
  status: PredictionStatus = PredictionStatus.PENDING;
  errorMessage: string | null = null;
  createdAt: Date = new Date();
}
