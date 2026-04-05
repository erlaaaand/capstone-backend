// src/ai-integration/applications/dto/ai-predict-response.dto.ts

/**
 * Representasi raw response dari FastAPI sebelum di-mapping.
 */
export class AiRawPredictionDto {
  variety_code: string = '';
  confidence_score: number = 0;
}

export class AiPredictResponseDto {
  prediction: AiRawPredictionDto = new AiRawPredictionDto();
}

/**
 * Representasi setelah di-mapping ke domain internal.
 */
export class AiPredictResultDto {
  predictionId: string = '';
  varietyCode: string = '';
  confidenceScore: number = 0;
}
