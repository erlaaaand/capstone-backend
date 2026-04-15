// src/ai-integration/infrastructures/listeners/prediction-created.listener.ts
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { AiIntegrationOrchestrator } from '../../applications/orchestrator/ai-integration.orchestrator';
import { AiIntegrationDomainService } from '../../domains/services/ai-integration-domain.service';
import { AiHealthService } from '../health/ai-health.service';
import {
  type IPredictionRepository,
  PREDICTION_REPOSITORY_TOKEN,
} from '../../../predictions/infrastructures/repositories/prediction.repository.interface';
import { Inject } from '@nestjs/common';
import { PredictionCreatedEvent } from '../../../predictions/infrastructures/events/prediction-created.event';

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
    private readonly orchestrator:    AiIntegrationOrchestrator,
    private readonly domainService:   AiIntegrationDomainService,
    private readonly aiHealthService: AiHealthService,
    private readonly config:          ConfigService,

    /**
     * FIX: Inject predictionRepo agar bisa memanggil markAsFailed
     * ketika terjadi error di listener (sebelum masuk ProcessPredictionUseCase).
     *
     * Sebelumnya, error di listener (misal: download image gagal) hanya
     * di-log tanpa mengubah status prediction → prediction stuck PENDING
     * selamanya tanpa ada indikasi error ke user.
     */
    @Inject(PREDICTION_REPOSITORY_TOKEN)
    private readonly predictionRepo: IPredictionRepository,
  ) {}

  @OnEvent('prediction.created', { async: true })
  async handlePredictionCreated(event: PredictionCreatedEvent): Promise<void> {
    const { predictionId, imageUrl, userId } = event;

    this.logger.log(
      `[AI Listener] prediction.created → id=${predictionId}, url=${imageUrl}`,
    );

    try {
      // ── Step 1: Fail-fast AI status check ───────────────────────────────
      const currentStatus = this.aiHealthService.getCurrentStatus();

      if (currentStatus.status === 'OFFLINE') {
        throw new Error(
          `AI service sedang OFFLINE — ${currentStatus.message}`,
        );
      }

      if (!currentStatus.modelLoaded) {
        throw new Error(
          `AI service online namun model belum siap — ${currentStatus.message}`,
        );
      }

      this.logger.debug(
        `[AI Listener] AI status OK → id=${predictionId}`,
      );

      // ── Step 2: Download image ───────────────────────────────────────────
      const provider = this.config.get<string>('STORAGE_PROVIDER', 'local');

      this.logger.debug(
        `[AI Listener] Downloading image → provider=${provider}, url=${imageUrl}`,
      );

      const { buffer, mimeType } = provider === 'local'
        ? await this.downloadLocalImage(imageUrl)
        : await this.downloadRemoteImage(imageUrl);

      this.logger.debug(
        `[AI Listener] Download sukses → size=${buffer.length} bytes, mime=${mimeType}`,
      );

      // ── Step 3: Validasi MIME type ────────────────────────────────────────
      if (!ALLOWED_MIME_TYPES.has(mimeType)) {
        throw new Error(
          `MIME type '${mimeType}' tidak didukung. Diizinkan: ${[...ALLOWED_MIME_TYPES].join(', ')}`,
        );
      }

      // ── Step 4: Build file name dan proses ke AI ──────────────────────────
      const fileName = this.domainService.buildFileName(predictionId, mimeType);

      this.logger.debug(
        `[AI Listener] Mengirim ke AI → id=${predictionId}, file=${fileName}, size=${buffer.length}`,
      );

      await this.orchestrator.process({
        predictionId,
        userId,
        imageBuffer:      buffer,
        imageMimeType:    mimeType,
        originalFileName: fileName,
      });

      this.logger.log(
        `[AI Listener] Selesai → id=${predictionId}`,
      );

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);

      this.logger.error(
        `[AI Listener] GAGAL → id=${predictionId}, reason=${message}`,
      );

      /**
       * FIX: Panggil markAsFailed agar prediction tidak stuck PENDING.
       *
       * Sebelumnya, error di listener hanya di-log tanpa mengubah status.
       * Akibatnya, prediction stuck PENDING selamanya dan user tidak tahu
       * bahwa ada error.
       *
       * Sekarang, ANY error di listener (download gagal, MIME tidak valid,
       * dll.) akan mengubah status prediction menjadi FAILED dengan pesan
       * error yang jelas.
       *
       * Note: Jika error terjadi SETELAH orchestrator.process() dipanggil,
       * ProcessPredictionUseCase sudah punya try-catch sendiri yang memanggil
       * markAsFailed. Di sini kita tangkap error yang terjadi SEBELUM itu.
       */
      await this.predictionRepo
        .markAsFailed(predictionId, `[Listener] ${message}`)
        .catch((markErr: unknown) => {
          const markErrMsg = markErr instanceof Error ? markErr.message : String(markErr);
          this.logger.error(
            `[AI Listener] Gagal markAsFailed → id=${predictionId}, reason=${markErrMsg}`,
          );
        });
    }
  }

  /**
   * Download image dari local storage.
   *
   * FIX [IP-Agnostic]:
   * Gunakan URL parser untuk mengekstrak path — tidak bergantung pada IP/host.
   * Sehingga jika APP_BASE_URL berubah (ganti jaringan), image URL lama
   * yang tersimpan di DB tetap bisa di-resolve ke file yang benar.
   */
  private async downloadLocalImage(
    imageUrl: string,
  ): Promise<{ buffer: Buffer; mimeType: string }> {
    const uploadDir = this.config.get<string>('STORAGE_LOCAL_DIR', 'uploads');

    let relativePath: string;

    try {
      const parsed   = new URL(imageUrl);
      const pathname = parsed.pathname; // e.g. "/uploads/predictions/userId/abc.png"

      const uploadsPrefix = '/uploads/';
      if (pathname.startsWith(uploadsPrefix)) {
        relativePath = pathname.slice(uploadsPrefix.length);
        // e.g. "predictions/userId/abc.png"
      } else if (pathname.startsWith('/')) {
        relativePath = pathname.slice(1);
      } else {
        relativePath = pathname;
      }
    } catch {
      // imageUrl bukan URL lengkap — gunakan apa adanya
      this.logger.warn(
        `[AI Listener] imageUrl bukan URL lengkap, gunakan sebagai path: ${imageUrl}`,
      );
      relativePath = imageUrl;
    }

    // Sanitasi path traversal
    const normalizedPath = path
      .normalize(relativePath)
      .replace(/^(\.\.(\/|\\|$))+/, '');

    const uploadsAbsolute = path.resolve(process.cwd(), uploadDir);
    const fullPath        = path.join(uploadsAbsolute, normalizedPath);

    // Security: pastikan path masih dalam uploadDir
    const expectedPrefix = uploadsAbsolute + path.sep;
    if (!fullPath.startsWith(expectedPrefix) && fullPath !== uploadsAbsolute) {
      throw new Error(
        `Path traversal terdeteksi: '${relativePath}' keluar dari direktori uploads.`,
      );
    }

    this.logger.debug(`[AI Listener] Membaca file: ${fullPath}`);

    // Cek keberadaan file
    try {
      await fs.access(fullPath);
    } catch {
      throw new Error(
        `File tidak ditemukan di local storage: ${fullPath}\n` +
          `imageUrl: ${imageUrl}\n` +
          `relativePath: ${relativePath}\n` +
          `Pastikan STORAGE_LOCAL_DIR='${uploadDir}' sudah benar di .env`,
      );
    }

    const buffer   = await fs.readFile(fullPath);
    const mimeType = this.guessMimeType(fullPath);

    return { buffer, mimeType };
  }

  private async downloadRemoteImage(
    imageUrl: string,
  ): Promise<{ buffer: Buffer; mimeType: string }> {
    const response = await fetch(imageUrl);

    if (!response.ok) {
      throw new Error(
        `Gagal download image: HTTP ${response.status} dari ${imageUrl}`,
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer      = Buffer.from(arrayBuffer);

    const rawContentType = response.headers.get('content-type') ?? '';
    const mimeType       = rawContentType.split(';')[0].trim() || FALLBACK_MIME_TYPE;

    return { buffer, mimeType };
  }

  private guessMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();

    const mimeMap: Record<string, string> = {
      '.jpg':  'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png':  'image/png',
      '.webp': 'image/webp',
    };

    const resolved = mimeMap[ext];

    if (!resolved) {
      this.logger.warn(
        `[AI Listener] Ekstensi '${ext}' tidak dikenal dari '${filePath}'. ` +
          `Menggunakan fallback: '${FALLBACK_MIME_TYPE}'.`,
      );
      return FALLBACK_MIME_TYPE;
    }

    return resolved;
  }
}
