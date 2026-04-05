// src/ai-integration/applications/dto/ai-predict-request.dto.ts

/**
 * Representasi internal request yang akan dikirim ke FastAPI.
 * Bukan DTO HTTP dari client — ini kontrak internal antar layer.
 *
 * FastAPI menerima:
 *   POST /api/v1/predict
 *   Content-Type: multipart/form-data
 *   field: file (binary image)
 */
export class AiPredictRequestDto {
  /** UUID prediction record yang sedang diproses. */
  predictionId: string = '';

  /** UUID user pemilik prediction. */
  userId: string = '';

  /** Raw binary buffer gambar yang akan dikirim sebagai multipart file. */
  imageBuffer: Buffer = Buffer.alloc(0);

  /** MIME type gambar: image/jpeg | image/png | image/webp */
  imageMimeType: string = '';

  /** Nama file asli, digunakan sebagai filename di form-data. */
  originalFileName: string = '';
}
