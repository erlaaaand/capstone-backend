// src/ai-integration/applications/dto/ai-predict-response.dto.ts

/**
 * Representasi satu varietas dalam array all_varieties dari FastAPI.
 */
export class AiVarietyScoreDto {
  variety_code: string = '';
  variety_name: string = '';
  confidence_score: number = 0;
}

/**
 * Representasi object `prediction` (top-1) dari response FastAPI.
 * Semua field dari Pydantic PredictionResult di-mirror di sini.
 */
export class AiRawPredictionDto {
  variety_code: string = '';
  variety_name: string = '';
  local_name: string = '';
  origin: string = '';
  description: string = '';
  confidence_score: number = 0;
}

/**
 * Representasi LENGKAP response FastAPI /api/v1/predict (HTTP 200).
 * Disesuaikan dengan Pydantic schema `PredictionResponse` di FastAPI.
 *
 * FIX: Tambah field `preprocessing_time_ms` yang ada di FastAPI
 * tapi sebelumnya tidak di-type di sini, sehingga tidak bisa
 * di-akses secara type-safe oleh adapter.
 */
export class AiPredictResponseDto {
  success: boolean = false;
  prediction: AiRawPredictionDto = new AiRawPredictionDto();
  all_varieties: AiVarietyScoreDto[] = [];
  /** Keys adalah variety_name (display name), bukan variety_code */
  confidence_scores: Record<string, number> = {};
  image_enhanced: boolean = false;
  inference_time_ms: number = 0;
  preprocessing_time_ms: number = 0;
  model_version: string | null = null;
  request_id: string | null = null;
}

/**
 * Representasi internal setelah response FastAPI di-mapping ke domain NestJS.
 * Menggunakan camelCase sesuai konvensi NestJS/TypeScript.
 *
 * FIX: Tambah `preprocessingTimeMs` untuk menyimpan waktu preprocessing
 * dari FastAPI — berguna untuk monitoring performa.
 */
export class AiPredictResultDto {
  predictionId: string = '';
  varietyCode: string = '';
  varietyName: string = '';
  localName: string = '';
  origin: string = '';
  description: string = '';
  confidenceScore: number = 0;
  imageEnhanced: boolean = false;
  inferenceTimeMs: number = 0;
  preprocessingTimeMs: number = 0;
}
