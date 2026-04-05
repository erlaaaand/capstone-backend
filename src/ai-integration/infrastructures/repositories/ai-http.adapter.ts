// src/ai-integration/infrastructures/repositories/ai-http.adapter.ts
import {
  Injectable,
  InternalServerErrorException,
  Logger,
  RequestTimeoutException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import FormData from 'form-data';
import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios';
import { AiPredictRequestDto } from '../../applications/dto/ai-predict-request.dto';
import {
  AiPredictResponseDto,
  AiPredictResultDto,
} from '../../applications/dto/ai-predict-response.dto';
import { IAiHttpAdapter } from './ai-http.adapter.interface';

@Injectable()
export class AiHttpAdapter implements IAiHttpAdapter {
  private readonly logger = new Logger(AiHttpAdapter.name);
  private readonly client: AxiosInstance;
  private readonly apiKey: string;

  constructor(private readonly config: ConfigService) {
    const baseURL = this.config.getOrThrow<string>('FASTAPI_BASE_URL');
    this.apiKey = this.config.getOrThrow<string>('FASTAPI_API_KEY');

    this.client = axios.create({
      baseURL,
      timeout: 30_000, // 30 detik — AI inference bisa lambat
      headers: {
        'X-API-Key': this.apiKey,
      },
    });

    this.registerInterceptors();
  }

  async predict(request: AiPredictRequestDto): Promise<AiPredictResultDto> {
    const form = new FormData();
    form.append('file', request.imageBuffer, {
      filename: request.originalFileName,
      contentType: request.imageMimeType,
    });

    this.logger.log(
      `[AI] Sending predict request → predictionId=${request.predictionId}`,
    );

    const response = await this.executeWithRetry<AiPredictResponseDto>(
      () =>
        this.client.post<AiPredictResponseDto>('/api/v1/predict', form, {
          headers: form.getHeaders(),
        }),
      { maxRetries: 3, delayMs: 1_000, predictionId: request.predictionId },
    );

    this.logger.log(
      `[AI] Received response → predictionId=${request.predictionId}, ` +
        `variety=${response.prediction.variety_code}, ` +
        `confidence=${response.prediction.confidence_score}`,
    );

    return {
      predictionId: request.predictionId,
      varietyCode: response.prediction.variety_code,
      confidenceScore: response.prediction.confidence_score,
    };
  }

  // ── Private Helpers ────────────────────────────────────────────

  private async executeWithRetry<T>(
    fn: () => Promise<AxiosResponse<T>>,
    options: { maxRetries: number; delayMs: number; predictionId: string },
  ): Promise<T> {
    let lastError: Error = new Error('Unknown error');

    for (let attempt = 1; attempt <= options.maxRetries; attempt++) {
      try {
        const response = await fn();
        return response.data;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        const isRetryable = this.isRetryableError(err);

        this.logger.warn(
          `[AI] Attempt ${attempt}/${options.maxRetries} failed → ` +
            `predictionId=${options.predictionId}, ` +
            `retryable=${isRetryable}, ` +
            `reason=${lastError.message}`,
        );

        if (!isRetryable || attempt === options.maxRetries) break;

        await this.delay(options.delayMs * attempt); // exponential backoff
      }
    }

    this.translateAndThrow(lastError);
  }

  private isRetryableError(err: unknown): boolean {
    if (!axios.isAxiosError(err)) return false;
    const axiosErr = err as AxiosError;

    // Retry pada: network error, timeout, 503 Service Unavailable
    if (!axiosErr.response) return true; // network/timeout
    return axiosErr.response.status === 503;
  }

  private translateAndThrow(err: Error): never {
    if (!axios.isAxiosError(err)) {
      throw new InternalServerErrorException(
        `AI service error: ${err.message}`,
      );
    }

    const axiosErr = err as AxiosError;

    if (axiosErr.code === 'ECONNABORTED' || axiosErr.code === 'ETIMEDOUT') {
      throw new RequestTimeoutException(
        'AI service tidak merespons dalam batas waktu yang ditentukan',
      );
    }

    if (!axiosErr.response) {
      throw new ServiceUnavailableException(
        'AI service tidak dapat dijangkau saat ini',
      );
    }

    const status = axiosErr.response.status;

    if (status === 503) {
      throw new ServiceUnavailableException('AI service sedang tidak tersedia');
    }

    if (status === 422) {
      throw new InternalServerErrorException(
        'AI service menolak format file yang dikirim',
      );
    }

    throw new InternalServerErrorException(
      `AI service mengembalikan status tidak terduga: ${status}`,
    );
  }

  private registerInterceptors(): void {
    this.client.interceptors.request.use((config) => {
      this.logger.debug(
        `[AI HTTP →] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`,
      );
      return config;
    });

    this.client.interceptors.response.use(
      (response) => {
        this.logger.debug(
          `[AI HTTP ←] ${response.status} ${response.config.url}`,
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
