// src/predictions/applications/dto/prediction-response.dto.ts
import { PredictionStatus } from '../../domains/entities/prediction.entity';

export class PredictionResponseDto {
  id: string = '';
  userId: string = '';
  varietyCode: string | null = null;
  confidenceScore: number | null = null;
  imageUrl: string = '';
  status: PredictionStatus = PredictionStatus.PENDING;
  errorMessage: string | null = null;
  createdAt: Date = new Date();
}
