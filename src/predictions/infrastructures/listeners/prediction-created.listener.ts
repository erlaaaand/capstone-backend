// src/ai-integration/infrastructures/listeners/prediction-created.listener.ts
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { AiIntegrationOrchestrator } from '../../../ai-integration/applications/orchestrator/ai-integration.orchestrator';
import { AiIntegrationDomainService } from '../../../ai-integration/domains/services/ai-integration-domain.service';
import { AiHealthService } from '../../../ai-integration/infrastructures/health/ai-health.service';
import { PredictionCreatedEvent } from '../../../predictions/infrastructures/events/prediction-created.event';

const ALLOWED_MIME_TYPES = new Set<string>([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const FALLBACK_MIME_TYPE = 'image/jpeg';

/**
 * FIX [HIGH]: Timeout untuk download gambar via fetch().
 * Tanpa timeout, request bisa hang selamanya jika server eksternal lambat/mati.
 * 15 detik = cukup untuk download gambar besar via koneksi lambat.
 */
const DOWNLOAD_TIMEOUT_MS = 15_000;

/**
 * FIX [HIGH]: Maximum ukuran file yang diizinkan didownload.
 * Mencegah attacker mengarahkan ke URL yang mengembalikan file sangat besar
 * untuk menguras memory server (zip bomb via HTTP response).
 */
const MAX_DOWNLOAD_BYTES = 10 * 1024 * 1024; // 10MB

/**
 * FIX [MEDIUM]: Hostname yang diblokir untuk mencegah SSRF.
 * imageUrl sudah divalidasi di CreatePredictionUseCase, tapi kita
 * tambahkan double-check di sini sebagai defense-in-depth.
 */
const BLOCKED_HOSTNAMES = new Set<string>([
  'localhost',
  '127.0.0.1',
  '::1',
  '169.254.169.254', // AWS metadata
  '0.0.0.0',
]);

function isBlockedHostname(imageUrl: string): boolean {
  try {
    const { hostname, protocol } = new URL(imageUrl);
    if (!['http:', 'https:'].includes(protocol)) return true;
    if (BLOCKED_HOSTNAMES.has(hostname.toLowerCase()))  return true;

    // Private IP ranges
    const h = hostname.toLowerCase().replace(/^\[|\]$/g, ''); // IPv6
    if (
      /^10\.\d+\.\d+\.\d+$/.test(h)                         ||
      /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/.test(h)         ||
      /^192\.168\.\d+\.\d+$/.test(h)
    ) return true;

    return false;
  } catch {
    return true; // URL parse gagal → blokir
  }
}

@Injectable()
export class AiPredictionCreatedListener {
  private readonly logger = new Logger(AiPredictionCreatedListener.name);

  constructor(
    private readonly orchestrator:   AiIntegrationOrchestrator,
    private readonly domainService:  AiIntegrationDomainService,
    private readonly aiHealthService: AiHealthService,
    private readonly config:         ConfigService,
  ) {}

  @OnEvent('prediction.created', { async: true })
  async handlePredictionCreated(event: PredictionCreatedEvent): Promise<void> {
    this.logger.log(
      `[AI Listener] prediction.created → id=${event.predictionId}`,
    );

    try {
      // ── FAIL-FAST: cek status AI ─────────────────────────────
      const currentStatus = this.aiHealthService.getCurrentStatus();
      if (currentStatus.status === 'OFFLINE') {
        throw new Error(
          `AI service OFFLINE — ${currentStatus.message}. ` +
          `id=${event.predictionId} tidak diproses.`,
        );
      }
      if (!currentStatus.modelLoaded) {
        throw new Error(
          `AI online tapi model belum siap — ${currentStatus.message}. ` +
          `id=${event.predictionId} tidak diproses.`,
        );
      }

      // ── FIX [HIGH]: Double-check SSRF sebelum download ───────
      if (isBlockedHostname(event.imageUrl)) {
        throw new Error(
          `imageUrl '${event.imageUrl}' diblokir (SSRF protection). ` +
          `id=${event.predictionId}`,
        );
      }

      const { buffer, mimeType } = await this.downloadImage(event.imageUrl);

      if (!ALLOWED_MIME_TYPES.has(mimeType)) {
        throw new Error(
          `MIME type '${mimeType}' tidak didukung. ` +
          `Diizinkan: ${[...ALLOWED_MIME_TYPES].join(', ')}. ` +
          `imageUrl=${event.imageUrl}`,
        );
      }

      const fileName = this.domainService.buildFileName(event.predictionId, mimeType);

      await this.orchestrator.process({
        predictionId:     event.predictionId,
        userId:           event.userId,
        imageBuffer:      buffer,
        imageMimeType:    mimeType,
        originalFileName: fileName,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `[AI Listener] Gagal → id=${event.predictionId}, ${message}`,
      );
    }
  }

  private async downloadImage(
    imageUrl: string,
  ): Promise<{ buffer: Buffer; mimeType: string }> {
    const provider = this.config.get<string>('STORAGE_PROVIDER', 'local');
    return provider === 'local'
      ? this.downloadLocalImage(imageUrl)
      : this.downloadRemoteImage(imageUrl);
  }

  private async downloadLocalImage(
    imageUrl: string,
  ): Promise<{ buffer: Buffer; mimeType: string }> {
    const uploadDir = this.config.get<string>('STORAGE_LOCAL_DIR', 'uploads');
    const baseUrl   = this.config.getOrThrow<string>('APP_BASE_URL');

    const uploadPrefix = `${baseUrl}/uploads/`;
    const relativePath = imageUrl.startsWith(uploadPrefix)
      ? imageUrl.slice(uploadPrefix.length)
      : imageUrl;

    // FIX: Normalisasi dan validasi path sebelum membaca file
    const normalizedRelative = path.normalize(relativePath);
    if (normalizedRelative.startsWith('..') || path.isAbsolute(normalizedRelative)) {
      throw new Error(
        `Path traversal terdeteksi di imageUrl: '${relativePath}'. ` +
        `id ditolak untuk keamanan.`,
      );
    }

    const fullPath = path.join(process.cwd(), uploadDir, normalizedRelative);
    const buffer   = await fs.readFile(fullPath);
    const mimeType = this.guessMimeType(fullPath);
    return { buffer, mimeType };
  }

  private async downloadRemoteImage(
    imageUrl: string,
  ): Promise<{ buffer: Buffer; mimeType: string }> {
    // FIX [HIGH]: AbortController untuk timeout — fetch native tidak punya timeout built-in
    const controller = new AbortController();
    const timeoutId  = setTimeout(
      () => controller.abort(),
      DOWNLOAD_TIMEOUT_MS,
    );

    let response: Response;
    try {
      response = await fetch(imageUrl, { signal: controller.signal });
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error(
          `Timeout download gambar setelah ${DOWNLOAD_TIMEOUT_MS}ms: ${imageUrl}`,
        );
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      throw new Error(`Gagal download image: HTTP ${response.status} dari ${imageUrl}`);
    }

    // FIX [HIGH]: Cek Content-Length sebelum download body
    // Mencegah server mengembalikan response besar yang menguras memory
    const contentLengthHeader = response.headers.get('content-length');
    if (contentLengthHeader) {
      const contentLength = parseInt(contentLengthHeader, 10);
      if (!isNaN(contentLength) && contentLength > MAX_DOWNLOAD_BYTES) {
        throw new Error(
          `File terlalu besar: ${contentLength} bytes (maks ${MAX_DOWNLOAD_BYTES}). ` +
          `URL: ${imageUrl}`,
        );
      }
    }

    const arrayBuffer = await response.arrayBuffer();

    // FIX: Validasi ukuran setelah download (jika server tidak kirim Content-Length)
    if (arrayBuffer.byteLength > MAX_DOWNLOAD_BYTES) {
      throw new Error(
        `File terlalu besar setelah download: ${arrayBuffer.byteLength} bytes. ` +
        `URL: ${imageUrl}`,
      );
    }

    const buffer          = Buffer.from(arrayBuffer);
    const rawContentType  = response.headers.get('content-type') ?? '';
    const mimeType        = rawContentType.split(';')[0].trim() || FALLBACK_MIME_TYPE;

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
        `[AI Listener] Ekstensi tidak dikenal: '${ext}', fallback ke '${FALLBACK_MIME_TYPE}'.`,
      );
      return FALLBACK_MIME_TYPE;
    }
    return resolved;
  }
}
