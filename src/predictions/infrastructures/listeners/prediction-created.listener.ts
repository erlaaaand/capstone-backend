// src/ai-integration/infrastructures/listeners/prediction-created.listener.ts
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { AiIntegrationOrchestrator } from '../../../ai-integration/applications/orchestrator/ai-integration.orchestrator';
import { AiIntegrationDomainService } from '../../../ai-integration/domains/services/ai-integration-domain.service';
import { PredictionCreatedEvent } from '../../../predictions/infrastructures/events/prediction-created.event';

// FIX: Removed the unused imports of LocalStorageAdapter, S3StorageAdapter,
//      IStorageAdapter, and STORAGE_ADAPTER_TOKEN. None of them are used in
//      the class body — keeping them causes `@typescript-eslint/no-unused-vars`
//      and misleads the reader about dependencies.

@Injectable()
export class AiPredictionCreatedListener {
  private readonly logger = new Logger(AiPredictionCreatedListener.name);

  constructor(
    private readonly orchestrator: AiIntegrationOrchestrator,
    private readonly domainService: AiIntegrationDomainService,
    private readonly config: ConfigService,
  ) {}

  @OnEvent('prediction.created', { async: true })
  async handlePredictionCreated(event: PredictionCreatedEvent): Promise<void> {
    this.logger.log(
      `[AI Listener] prediction.created → id=${event.predictionId}`,
    );

    try {
      const { buffer, mimeType } = await this.downloadImage(event.imageUrl);

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
      // FIX: `err` typed as `unknown`; narrow before accessing `.message`
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `[AI Listener] Gagal memproses prediction → id=${event.predictionId}, ${message}`,
      );
    }
  }

  /**
   * Download image dari imageUrl menjadi Buffer.
   * Mendukung local file path dan remote URL (S3/CDN).
   */
  private async downloadImage(
    imageUrl: string,
  ): Promise<{ buffer: Buffer; mimeType: string }> {
    // FIX: Supply explicit default ('local') so `provider` is always `string`,
    //      never `string | undefined`. Avoids downstream strict-null issues.
    const provider = this.config.get<string>('STORAGE_PROVIDER', 'local');

    if (provider === 'local') {
      return this.downloadLocalImage(imageUrl);
    }

    // S3 / remote URL — fetch via HTTP
    return this.downloadRemoteImage(imageUrl);
  }

  // FIX: Extracted local-download logic into its own private method.
  //      The original inlined a multi-step async sequence inside an `if` branch
  //      of `downloadImage`, making it harder to type-check independently.
  private async downloadLocalImage(
    imageUrl: string,
  ): Promise<{ buffer: Buffer; mimeType: string }> {
    const uploadDir = this.config.get<string>('STORAGE_LOCAL_DIR', 'uploads');
    const baseUrl = this.config.getOrThrow<string>('APP_BASE_URL');

    // FIX: `imageUrl.replace(...)` is safe — both operands are `string`.
    //      Using `encodeURI`-safe replacement to extract the relative path.
    const uploadPrefix = `${baseUrl}/uploads/`;
    const relativePath = imageUrl.startsWith(uploadPrefix)
      ? imageUrl.slice(uploadPrefix.length)
      : imageUrl;

    // FIX: `path.join` accepts `string[]`; `uploadDir` is guaranteed `string`
    //      after the default above, so no unsafe call.
    const fullPath = path.join(process.cwd(), uploadDir, relativePath);

    // FIX: `fs.readFile` returns `Promise<Buffer>` — safe, no unsafe-assignment.
    const buffer = await fs.readFile(fullPath);
    const mimeType = this.guessMimeType(fullPath);

    return { buffer, mimeType };
  }

  private async downloadRemoteImage(
    imageUrl: string,
  ): Promise<{ buffer: Buffer; mimeType: string }> {
    // FIX: `fetch` returns `Promise<Response>`. We must check `response.ok`
    //      before consuming the body to avoid silent failures.
    const response = await fetch(imageUrl);

    if (!response.ok) {
      throw new Error(`Gagal download image: HTTP ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // FIX: `response.headers.get(...)` returns `string | null`.
    //      Use `?? 'image/jpeg'` (nullish coalescing) — not `?? ` with
    //      a truthy check — so an empty-string Content-Type falls through
    //      correctly. An empty string is a valid (if unusual) header value;
    //      `?? 'image/jpeg'` only substitutes on `null`, which is correct.
    const mimeType: string =
      response.headers.get('content-type') ?? 'image/jpeg';

    return { buffer, mimeType };
  }

  // FIX: `guessMimeType` is a pure sync helper — no `async` needed.
  //      The return type is `string` (never undefined) because the Record
  //      lookup has a fallback via `?? 'image/jpeg'`.
  private guessMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();

    // FIX: Type the map explicitly so the index signature is `string → string`,
    //      preventing `string | undefined` from leaking out of the lookup.
    const mimeMap: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
    };

    // FIX: `mimeMap[ext]` is `string | undefined` under `noUncheckedIndexedAccess`.
    //      Use nullish coalescing with a safe fallback.
    return mimeMap[ext] ?? 'image/jpeg';
  }
}
