// src/ai-integration/domains/mappers/ai-response.mapper.ts
import { Injectable } from '@nestjs/common';
import { AiPredictResultDto } from '../../applications/dto/ai-predict-response.dto';
import { PredictionResultPayload } from '../../../predictions/infrastructures/repositories/prediction.repository.interface';

@Injectable()
export class AiResponseMapper {
  /**
   * Memetakan AiPredictResultDto (internal domain) ke PredictionResultPayload
   * yang digunakan untuk update database via IPredictionRepository.
   *
   * FIX: `inferenceTimeMs` sekarang digabung dengan `preprocessingTimeMs`
   * untuk menyimpan total waktu AI processing di DB, sehingga client
   * mendapat gambaran lengkap performa pipeline.
   */
  toPredictionResultPayload(
    result: AiPredictResultDto,
  ): PredictionResultPayload {
    return {
      varietyCode:     result.varietyCode.trim().toUpperCase(),
      varietyName:     result.varietyName.trim(),
      localName:       result.localName.trim(),
      origin:          result.origin.trim(),
      description:     result.description.trim(),
      confidenceScore: this.normalizeScore(result.confidenceScore),
      imageEnhanced:   result.imageEnhanced,
      inferenceTimeMs: result.inferenceTimeMs,
    };
  }

  private normalizeScore(score: number): number {
    // Presisi 4 desimal konsisten dengan kolom DB decimal(5,4)
    return parseFloat(score.toFixed(4));
  }
}
