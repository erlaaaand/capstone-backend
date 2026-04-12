// src/predictions/applications/use-cases/create-prediction.use-case.ts
import {
  Inject,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreatePredictionDto } from '../dto/create-prediction.dto';
import { PredictionResponseDto } from '../dto/prediction-response.dto';
import { PredictionMapper } from '../../domains/mappers/prediction.mapper';
import { PREDICTION_REPOSITORY_TOKEN } from '../../infrastructures/repositories/prediction.repository.interface';
import type { IPredictionRepository } from '../../infrastructures/repositories/prediction.repository.interface';
import { PredictionCreatedEvent } from '../../infrastructures/events/prediction-created.event';

@Injectable()
export class CreatePredictionUseCase {
  constructor(
    @Inject(PREDICTION_REPOSITORY_TOKEN)
    private readonly predictionRepo: IPredictionRepository,
    private readonly mapper: PredictionMapper,
    private readonly eventEmitter: EventEmitter2,

    /**
     * FIX [SSRF-WHITELIST]: Inject ConfigService untuk membaca
     * APP_BASE_URL — digunakan untuk whitelist URL storage milik
     * aplikasi sendiri dari pemeriksaan SSRF.
     */
    private readonly config: ConfigService,
  ) {}

  /**
   * FIX [CRITICAL-02]: userId sekarang diterima sebagai parameter
   * terpisah — diambil dari JWT token oleh controller,
   * BUKAN dari request body (eliminasi IDOR vulnerability).
   *
   * FIX [CRITICAL-03 + SSRF-WHITELIST]:
   *
   * MASALAH SEBELUMNYA:
   *   isSafeImageUrl() memblokir SEMUA IP private termasuk 192.168.x.x.
   *   Tapi APP_BASE_URL di environment development adalah
   *   'http://192.168.10.240:3000' — alamat IP jaringan lokal.
   *
   *   Flow yang gagal:
   *   1. User upload gambar → response: 'http://192.168.10.240:3000/uploads/...'
   *   2. User kirim URL itu ke POST /predictions
   *   3. isSafeImageUrl() → hostname '192.168.10.240' → cocok regex 192.168.x.x
   *      → return false → UnprocessableEntityException
   *   4. Prediksi tidak pernah dibuat, AI tidak pernah dipanggil.
   *
   * SOLUSI:
   *   Whitelist URL yang diawali APP_BASE_URL (URL storage milik app sendiri).
   *   Hanya URL eksternal yang melewati pemeriksaan SSRF penuh.
   *
   *   Ini aman karena:
   *   - APP_BASE_URL sudah divalidasi di env.validation.ts (IsUrl)
   *   - File yang diupload sudah melewati validasi mime type + ukuran
   *     di StorageModule sebelum URL ini dibuat
   *   - Attacker tidak bisa menipu URL karena harus dimulai persis
   *     dengan APP_BASE_URL yang dikonfigurasi server
   */
  async execute(
    dto: CreatePredictionDto,
    authenticatedUserId: string,
  ): Promise<PredictionResponseDto> {
    const appBaseUrl = this.config.getOrThrow<string>('APP_BASE_URL');

    // Normalisasi: pastikan tidak ada trailing slash agar pencocokan konsisten
    const normalizedBase = appBaseUrl.replace(/\/+$/, '');

    // URL dari storage app sendiri → langsung izinkan, skip SSRF check
    const isOwnStorageUrl = dto.imageUrl.startsWith(`${normalizedBase}/`);

    if (!isOwnStorageUrl && !CreatePredictionDto.isSafeImageUrl(dto.imageUrl)) {
      throw new UnprocessableEntityException(
        'imageUrl tidak valid: protokol tidak diizinkan atau ' +
          'mengarah ke alamat jaringan internal yang diblokir.',
      );
    }

    const prediction = await this.predictionRepo.create({
      // FIX [CRITICAL-02]: Gunakan authenticatedUserId dari JWT,
      // bukan dari dto — client tidak bisa menentukan userId sendiri
      userId:   authenticatedUserId,
      imageUrl: dto.imageUrl,
    });

    this.eventEmitter.emit(
      'prediction.created',
      new PredictionCreatedEvent(
        prediction.id,
        prediction.userId,
        prediction.imageUrl,
        new Date(),
      ),
    );

    return this.mapper.toResponseDto(prediction);
  }
}