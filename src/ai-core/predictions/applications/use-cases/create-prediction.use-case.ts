// src/predictions/applications/use-cases/create-prediction.use-case.ts
import {
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { CreatePredictionDto } from '../dto/create-prediction.dto';
import { PredictionResponseDto } from '../dto/prediction-response.dto';
import { PredictionMapper } from '../../domains/mappers/prediction.mapper';
import { PREDICTION_REPOSITORY_TOKEN } from '../../infrastructures/repositories/prediction.repository.interface';
import type { IPredictionRepository } from '../../infrastructures/repositories/prediction.repository.interface';
import { PredictionCreatedEvent } from '../../infrastructures/events/prediction-created.event';
import { AiIntegrationOrchestrator } from '../../../ai-integration/applications/orchestrator/ai-integration.orchestrator';
import { AiIntegrationDomainService } from '../../../ai-integration/domains/services/ai-integration-domain.service';
import { AiHealthService } from '../../../ai-integration/infrastructures/health/ai-health.service';

const ALLOWED_MIME_TYPES = new Set<string>([
  'image/jpeg',
  'image/png',
  'image/webp',
]);
const FALLBACK_MIME_TYPE = 'image/jpeg';

@Injectable()
export class CreatePredictionUseCase {
  private readonly logger = new Logger(CreatePredictionUseCase.name);

  constructor(
    @Inject(PREDICTION_REPOSITORY_TOKEN)
    private readonly predictionRepo: IPredictionRepository,

    private readonly mapper:       PredictionMapper,
    private readonly config:       ConfigService,
    private readonly eventEmitter: EventEmitter2,

    @Inject(forwardRef(() => AiIntegrationOrchestrator))
    private readonly aiOrchestrator: AiIntegrationOrchestrator,

    @Inject(forwardRef(() => AiIntegrationDomainService))
    private readonly aiDomainService: AiIntegrationDomainService,

    @Inject(forwardRef(() => AiHealthService))
    private readonly aiHealthService: AiHealthService,
  ) {}

  async execute(
    dto:                 CreatePredictionDto,
    authenticatedUserId: string,
  ): Promise<PredictionResponseDto> {

    // ── Guard: userId ─────────────────────────────────────────────────────
    if (!authenticatedUserId?.trim()) {
      throw new InternalServerErrorException(
        'User ID tidak dapat diekstrak dari JWT. Coba logout dan login kembali.',
      );
    }

    // ── Guard: AI harus online sebelum buat record ────────────────────────
    const aiStatus = this.aiHealthService.getCurrentStatus();
    if (aiStatus.status === 'OFFLINE') {
      throw new InternalServerErrorException(
        `AI service sedang OFFLINE — ${aiStatus.message}. Coba lagi nanti.`,
      );
    }
    if (!aiStatus.modelLoaded) {
      throw new InternalServerErrorException(
        `AI model belum siap — ${aiStatus.message}. Coba lagi nanti.`,
      );
    }

    // ── SSRF check ────────────────────────────────────────────────────────
    if (!this.isOwnStorage(dto.imageUrl) && !CreatePredictionDto.isSafeImageUrl(dto.imageUrl)) {
      throw new UnprocessableEntityException(
        'imageUrl tidak valid atau mengarah ke jaringan internal.',
      );
    }

    // ── Step 1: Simpan record PENDING ─────────────────────────────────────
    const prediction = await this.predictionRepo.create({
      userId:   authenticatedUserId.trim(),
      imageUrl: dto.imageUrl,
    });

    this.logger.log(`[Create] Record dibuat → id=${prediction.id}`);

    this.eventEmitter.emit(
      'prediction.created',
      new PredictionCreatedEvent(
        prediction.id,
        authenticatedUserId.trim(),
        dto.imageUrl,
        new Date(),
      ),
    );

    // ── Step 2: Download image ─────────────────────────────────────────────
    let buffer:   Buffer;
    let mimeType: string;

    try {
      const provider = this.config.get<string>('STORAGE_PROVIDER', 'local');
      ({ buffer, mimeType } = provider === 'local'
        ? await this.readLocalFile(dto.imageUrl)
        : await this.fetchRemoteFile(dto.imageUrl));
    } catch (err: unknown) {
      const reason = err instanceof Error ? err.message : String(err);
      await this.predictionRepo.markAsFailed(prediction.id, reason).catch(() => {});
      throw new InternalServerErrorException(`Gagal membaca file gambar: ${reason}`);
    }

    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      const reason = `MIME type '${mimeType}' tidak didukung`;
      await this.predictionRepo.markAsFailed(prediction.id, reason).catch(() => {});
      throw new UnprocessableEntityException(reason);
    }

    // ── Step 3: Kirim ke AI & tunggu ──────────────────────────────────────
    this.logger.log(`[Create] Mengirim ke AI → id=${prediction.id}`);

    await this.aiOrchestrator.process({
      predictionId:     prediction.id,
      userId:           authenticatedUserId,
      imageBuffer:      buffer,
      imageMimeType:    mimeType,
      originalFileName: this.aiDomainService.buildFileName(prediction.id, mimeType),
    });

    // ── Step 4: Fetch hasil akhir dari DB ─────────────────────────────────
    const final = await this.predictionRepo.findById(prediction.id);
    if (!final) {
      throw new InternalServerErrorException(
        `Prediction id=${prediction.id} tidak ditemukan setelah proses AI.`,
      );
    }

    this.logger.log(
      `[Create] DONE → id=${final.id}, status=${final.status}, ` +
        `variety=${final.varietyCode ?? 'N/A'}`,
    );

    return this.mapper.toResponseDto(final);
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private isOwnStorage(imageUrl: string): boolean {
    try {
      const appBase = new URL(this.config.getOrThrow<string>('APP_BASE_URL'));
      const img     = new URL(imageUrl);
      if (img.host === appBase.host) return true;
      if (
        this.config.get('NODE_ENV') !== 'production' &&
        img.pathname.startsWith('/uploads/')
      ) return true;
      return false;
    } catch {
      return false;
    }
  }

  private async readLocalFile(
    imageUrl: string,
  ): Promise<{ buffer: Buffer; mimeType: string }> {
    const uploadDir = this.config.get<string>('STORAGE_LOCAL_DIR', 'uploads');

    let relativePath: string;
    try {
      const pathname = new URL(imageUrl).pathname;
      relativePath = pathname.startsWith('/uploads/')
        ? pathname.slice('/uploads/'.length)
        : pathname.replace(/^\//, '');
    } catch {
      relativePath = imageUrl;
    }

    const normalized = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, '');
    const base       = path.resolve(process.cwd(), uploadDir);
    const fullPath   = path.join(base, normalized);

    if (!fullPath.startsWith(base + path.sep) && fullPath !== base) {
      throw new Error(`Path traversal terdeteksi: '${relativePath}'`);
    }

    try {
      await fs.access(fullPath);
    } catch {
      throw new Error(`File tidak ditemukan: ${fullPath}`);
    }

    const buffer   = await fs.readFile(fullPath);
    const mimeType = this.extToMime(path.extname(fullPath).toLowerCase());
    return { buffer, mimeType };
  }

  private async fetchRemoteFile(
    imageUrl: string,
  ): Promise<{ buffer: Buffer; mimeType: string }> {
    const res = await fetch(imageUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status} dari ${imageUrl}`);
    const buffer   = Buffer.from(await res.arrayBuffer());
    const mimeType = (res.headers.get('content-type') ?? '')
      .split(';')[0].trim() || FALLBACK_MIME_TYPE;
    return { buffer, mimeType };
  }

  private extToMime(ext: string): string {
    const map: Record<string, string> = {
      '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
      '.png': 'image/png',  '.webp': 'image/webp',
    };
    return map[ext] ?? FALLBACK_MIME_TYPE;
  }
}
