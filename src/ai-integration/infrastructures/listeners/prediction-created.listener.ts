// src/ai-integration/infrastructures/listeners/prediction-created.listener.ts
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { AiIntegrationOrchestrator } from '../../applications/orchestrator/ai-integration.orchestrator';
import { AiIntegrationDomainService } from '../../domains/services/ai-integration-domain.service';
import { PredictionCreatedEvent } from '../../../predictions/infrastructures/events/prediction-created.event';

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

    const mimeType: string =
      response.headers.get('content-type') ?? 'image/jpeg';

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

    return mimeMap[ext] ?? 'image/jpeg';
  }
}
