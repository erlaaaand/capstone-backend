// src/ai-integration/domains/mappers/ai-response.mapper.ts
import { Injectable } from '@nestjs/common';
import { AiPredictResultDto } from '../../applications/dto/ai-predict-response.dto';
import { PredictionResultPayload } from '../../../predictions/infrastructures/repositories/prediction.repository.interface';

@Injectable()
export class AiResponseMapper {
  toPredictionResultPayload(
    result: AiPredictResultDto,
  ): PredictionResultPayload {
    return {
      varietyCode: result.varietyCode.trim().toUpperCase(),
      confidenceScore: this.normalizeScore(result.confidenceScore),
    };
  }

  private normalizeScore(score: number): number {
    // Pastikan presisi 4 desimal konsisten dengan definisi kolom DB decimal(5,4)
    return parseFloat(score.toFixed(4));
  }
}
