// src/ai-integration/applications/dto/ai-predict-request.dto.ts

/**
 * Representasi internal request yang akan dikirim ke FastAPI.
 * Bukan DTO HTTP dari client — ini kontrak internal antar layer.
 */
export class AiPredictRequestDto {
  predictionId: string = '';
  userId: string = '';
  imageBuffer: Buffer = Buffer.alloc(0);
  imageMimeType: string = '';
  originalFileName: string = '';
}
