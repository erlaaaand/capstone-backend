// src/ai-integration/infrastructures/repositories/ai-http.adapter.ts
import {
  Injectable,
  InternalServerErrorException,
  Logger,
  RequestTimeoutException,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import FormData from 'form-data';
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { AiPredictRequestDto } from '../../applications/dto/ai-predict-request.dto';
import {
  AiPredictResponseDto,
  AiPredictResultDto,
} from '../../applications/dto/ai-predict-response.dto';
import { IAiHttpAdapter } from './ai-http.adapter.interface';

/**
 * Batas waktu per-attempt (ms).
 * Dengan maxRetries=3 dan delay linear, worst-case:
 *   3 × 15s timeout + (1s + 2s + 3s) delay = 51s
 */
const TIMEOUT_MS   = 15_000;
const MAX_RETRIES  = 3;
const BASE_DELAY_MS = 1_000;

@Injectable()
export class AiHttpAdapter implements IAiHttpAdapter {
  private readonly logger = new Logger(AiHttpAdapter.name);
  private readonly client: AxiosInstance;

  constructor(private readonly config: ConfigService) {
    const baseURL = this.config.getOrThrow<string>('FASTAPI_BASE_URL');
    const apiKey  = this.config.getOrThrow<string>('FASTAPI_API_KEY');

    this.client = axios.create({
      baseURL,
      timeout: TIMEOUT_MS,
      headers: {
        'X-API-Key': apiKey,
      },
    });

    this.registerInterceptors();
  }

  async predict(request: AiPredictRequestDto): Promise<AiPredictResultDto> {
    const form = new FormData();
    form.append('file', request.imageBuffer, {
      filename:    request.originalFileName,
      contentType: request.imageMimeType,
    });

    this.logger.log(
      `[AI] Sending predict request → predictionId=${request.predictionId}`,
    );

    const response = await this.executeWithRetry(
      (): Promise<AxiosResponse<AiPredictResponseDto>> =>
        this.client.post<AiPredictResponseDto>('/api/v1/predict', form, {
          headers: form.getHeaders(),
        }),
      {
        maxRetries:   MAX_RETRIES,
        baseDelayMs:  BASE_DELAY_MS,
        predictionId: request.predictionId,
      },
    );

    // ── Null-guard: FastAPI harus selalu mengembalikan `prediction` ──────────
    if (!response.prediction || typeof response.prediction !== 'object') {
      throw new InternalServerErrorException(
        `AI service mengembalikan response tanpa field 'prediction'. ` +
          `predictionId=${request.predictionId}`,
      );
    }

    // ── Guard: validasi field wajib sebelum destructuring ────────────────────
    if (!response.prediction.variety_code) {
      throw new InternalServerErrorException(
        `AI service mengembalikan 'variety_code' kosong. ` +
          `predictionId=${request.predictionId}`,
      );
    }

    const { prediction } = response;

    this.logger.log(
      `[AI] Received response → predictionId=${request.predictionId}, ` +
        `variety=${prediction.variety_code}, ` +
        `confidence=${prediction.confidence_score}, ` +
        `enhanced=${response.image_enhanced}, ` +
        `inf_ms=${response.inference_time_ms}, ` +
        `preproc_ms=${response.preprocessing_time_ms}`,
    );

    return {
      predictionId:        request.predictionId,
      varietyCode:         prediction.variety_code,
      varietyName:         prediction.variety_name,
      localName:           prediction.local_name,
      origin:              prediction.origin,
      description:         prediction.description,
      confidenceScore:     prediction.confidence_score,
      imageEnhanced:       response.image_enhanced,
      inferenceTimeMs:     response.inference_time_ms,
      preprocessingTimeMs: response.preprocessing_time_ms ?? 0,
      // ── BARU: map all_varieties dari FastAPI ke camelCase ──
      allVarieties: (response.all_varieties ?? []).map((v) => ({
        varietyCode:     v.variety_code,
        varietyName:     v.variety_name,
        confidenceScore: v.confidence_score,
      })),
      // ── BARU: metadata ──
      modelVersion: response.model_version ?? null,
      aiRequestId:  response.request_id ?? null,
    };
  }

  // ── Private Helpers ────────────────────────────────────────────────────────

  private async executeWithRetry(
    fn: () => Promise<AxiosResponse<AiPredictResponseDto>>,
    options: {
      maxRetries:   number;
      baseDelayMs:  number;
      predictionId: string;
    },
  ): Promise<AiPredictResponseDto> {
    let lastError: Error = new Error('Unknown error');

    for (let attempt = 1; attempt <= options.maxRetries; attempt++) {
      try {
        const response = await fn();

        // ── Guard: FastAPI mengembalikan success=false ─────────────────────
        // Ini terjadi jika CLIP menolak gambar (bukan durian) atau error lain.
        // Perlu di-handle di sini agar tidak lolos sebagai "success".
        if (response.data && response.data.success === false) {
          throw new InternalServerErrorException(
            `AI service mengembalikan success=false. predictionId=${options.predictionId}`,
          );
        }

        return response.data;
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));

        // Non-retryable error → langsung throw
        if (!this.isRetryableError(err)) {
          this.logger.warn(
            `[AI] Non-retryable error pada attempt ${attempt}/${options.maxRetries} → ` +
              `predictionId=${options.predictionId}, reason=${lastError.message}`,
          );
          break;
        }

        this.logger.warn(
          `[AI] Retryable error pada attempt ${attempt}/${options.maxRetries} → ` +
            `predictionId=${options.predictionId}, reason=${lastError.message}`,
        );

        if (attempt < options.maxRetries) {
          await this.delay(options.baseDelayMs * attempt);
        }
      }
    }

    this.translateAndThrow(lastError);
  }

  /**
   * Hanya retry untuk network error dan 503 Service Unavailable.
   * 400, 401, 403, 413, 415, 422 adalah error permanen pada request.
   */
  private isRetryableError(err: unknown): boolean {
    if (!axios.isAxiosError(err)) {
      // InternalServerErrorException dari guard di atas — tidak di-retry
      return false;
    }

    // Network error atau timeout (tidak ada response)
    if (!err.response) return true;

    // 503 (model belum siap) layak di-retry
    return err.response.status === 503;
  }

  /**
   * Terjemahkan AxiosError menjadi HttpException NestJS.
   *
   * Pemetaan status FastAPI → NestJS:
   * - network/timeout → RequestTimeoutException / ServiceUnavailableException
   * - 400             → UnprocessableEntityException (bukan gambar durian / CLIP rejection)
   * - 413             → UnprocessableEntityException (file terlalu besar)
   * - 415             → UnprocessableEntityException (tipe file tidak didukung)
   * - 422             → UnprocessableEntityException (gagal preprocessing)
   * - 503             → ServiceUnavailableException (model belum loaded)
   * - lainnya         → InternalServerErrorException
   */
  private translateAndThrow(err: Error): never {
    if (!axios.isAxiosError(err)) {
      throw new InternalServerErrorException(
        `AI service error tidak terduga: ${err.message}`,
      );
    }

    const code     = err.code;
    const response = err.response;

    if (code === 'ECONNABORTED' || code === 'ETIMEDOUT') {
      throw new RequestTimeoutException(
        'AI service tidak merespons dalam batas waktu yang ditentukan.',
      );
    }

    if (!response) {
      throw new ServiceUnavailableException(
        'AI service tidak dapat dijangkau saat ini (network error).',
      );
    }

    // FastAPI mengembalikan { detail: string } untuk error
    const detail = (response.data as { detail?: string } | undefined)?.detail;
    const status = response.status;

    switch (status) {
      case 400:
        // FastAPI 400: gambar ditolak CLIP (bukan durian) atau file kosong
        throw new UnprocessableEntityException(
          detail ??
            'AI service menolak gambar: bukan gambar durian yang valid, ' +
            'atau file gambar rusak/kosong.',
        );

      case 413:
        throw new UnprocessableEntityException(
          detail ?? 'Ukuran file gambar melebihi batas maksimum yang diterima AI service.',
        );

      case 415:
        throw new UnprocessableEntityException(
          detail ??
            'Tipe file tidak didukung oleh AI service. ' +
            'Gunakan format JPG, PNG, atau WebP.',
        );

      case 422:
        throw new UnprocessableEntityException(
          detail ??
            'AI service gagal memproses gambar (preprocessing error). ' +
            'Pastikan file gambar tidak rusak.',
        );

      case 503:
        throw new ServiceUnavailableException(
          detail ?? 'AI service sedang tidak tersedia (model belum siap). Coba lagi nanti.',
        );

      default:
        throw new InternalServerErrorException(
          `AI service mengembalikan status tidak terduga: ${status}. ` +
            (detail ? `Detail: ${detail}` : ''),
        );
    }
  }

  private registerInterceptors(): void {
    this.client.interceptors.request.use((config) => {
      this.logger.debug(
        `[AI HTTP →] ${config.method?.toUpperCase() ?? 'UNKNOWN'} ` +
          `${config.baseURL ?? ''}${config.url ?? ''}`,
      );
      return config;
    });

    this.client.interceptors.response.use(
      (response) => {
        this.logger.debug(
          `[AI HTTP ←] ${response.status} ${response.config.url ?? ''}`,
        );
        return response;
      },
      (error: unknown) => {
        if (error instanceof Error) {
          return Promise.reject(error);
        }
        return Promise.reject(new Error(String(error)));
      },
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
