// src/ai-integration/infrastructures/listeners/prediction-created.listener.ts
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { AiIntegrationOrchestrator } from '../../applications/orchestrator/ai-integration.orchestrator';
import { AiIntegrationDomainService } from '../../domains/services/ai-integration-domain.service';
import { AiHealthService } from '../health/ai-health.service';
import { PredictionCreatedEvent } from '../../../predictions/infrastructures/events/prediction-created.event';

/** MIME type yang diizinkan — harus sinkron dengan AiIntegrationDomainService */
const ALLOWED_MIME_TYPES = new Set<string>([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const FALLBACK_MIME_TYPE = 'image/jpeg';

@Injectable()
export class AiPredictionCreatedListener {
  private readonly logger = new Logger(AiPredictionCreatedListener.name);

  constructor(
    private readonly orchestrator: AiIntegrationOrchestrator,
    private readonly domainService: AiIntegrationDomainService,
    private readonly aiHealthService: AiHealthService,
    private readonly config: ConfigService,
  ) {}

  @OnEvent('prediction.created', { async: true })
  async handlePredictionCreated(event: PredictionCreatedEvent): Promise<void> {
    this.logger.log(
      `[AI Listener] prediction.created → id=${event.predictionId}`,
    );

    try {
      // ── FAIL-FAST CHECK ──────────────────────────────────────
      // Cek status AI dari memori SEBELUM download gambar dan kirim ke AI.
      // Ini menghemat bandwidth dan waktu jika AI sedang down.
      const currentStatus = this.aiHealthService.getCurrentStatus();

      if (currentStatus.status === 'OFFLINE') {
        throw new Error(
          `AI service sedang OFFLINE — ${currentStatus.message}. ` +
            `Prediction id=${event.predictionId} tidak dapat diproses saat ini.`,
        );
      }

      if (!currentStatus.modelLoaded) {
        throw new Error(
          `AI service online namun model belum siap — ${currentStatus.message}. ` +
            `Prediction id=${event.predictionId} tidak dapat diproses saat ini.`,
        );
      }
      // ── END FAIL-FAST CHECK ──────────────────────────────────

      const { buffer, mimeType } = await this.downloadImage(event.imageUrl);

      if (!ALLOWED_MIME_TYPES.has(mimeType)) {
        throw new Error(
          `MIME type '${mimeType}' tidak didukung oleh AI service. ` +
            `Diizinkan: ${[...ALLOWED_MIME_TYPES].join(', ')}. ` +
            `imageUrl=${event.imageUrl}`,
        );
      }

      const fileName = this.domainService.buildFileName(
        event.predictionId,
        mimeType,
      );

      await this.orchestrator.process({
        predictionId: event.predictionId,
        userId: event.userId,
        imageBuffer: buffer,
        imageMimeType: mimeType,
        originalFileName: fileName,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `[AI Listener] Gagal memproses prediction → id=${event.predictionId}, ${message}`,
      );
    }
  }

  private async downloadImage(
    imageUrl: string,
  ): Promise<{ buffer: Buffer; mimeType: string }> {
    const provider = this.config.get<string>('STORAGE_PROVIDER', 'local');

    if (provider === 'local') {
      return this.downloadLocalImage(imageUrl);
    }

    return this.downloadRemoteImage(imageUrl);
  }

  private async downloadLocalImage(
    imageUrl: string,
  ): Promise<{ buffer: Buffer; mimeType: string }> {
    const uploadDir = this.config.get<string>('STORAGE_LOCAL_DIR', 'uploads');
    const baseUrl = this.config.getOrThrow<string>('APP_BASE_URL');

    const uploadPrefix = `${baseUrl}/uploads/`;
    const relativePath = imageUrl.startsWith(uploadPrefix)
      ? imageUrl.slice(uploadPrefix.length)
      : imageUrl;

    const fullPath = path.join(process.cwd(), uploadDir, relativePath);
    const buffer = await fs.readFile(fullPath);
    const mimeType = this.guessMimeType(fullPath);

    return { buffer, mimeType };
  }

  private async downloadRemoteImage(
    imageUrl: string,
  ): Promise<{ buffer: Buffer; mimeType: string }> {
    const response = await fetch(imageUrl);

    if (!response.ok) {
      throw new Error(`Gagal download image: HTTP ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const rawContentType = response.headers.get('content-type') ?? '';
    const mimeType = rawContentType.split(';')[0].trim() || FALLBACK_MIME_TYPE;

    return { buffer, mimeType };
  }

  private guessMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();

    const mimeMap: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
    };

    const resolved = mimeMap[ext];

    if (!resolved) {
      this.logger.warn(
        `[AI Listener] Ekstensi file tidak dikenal: '${ext}' dari path '${filePath}'. ` +
          `Menggunakan fallback MIME type: '${FALLBACK_MIME_TYPE}'. ` +
          `Ini kemungkinan akan ditolak oleh AI service dengan HTTP 415.`,
      );
      return FALLBACK_MIME_TYPE;
    }

    return resolved;
  }
}
