// src/predictions/applications/use-cases/create-prediction.use-case.ts
import {
  Inject,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
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
  ) {}

  /**
   * FIX [CRITICAL-02]: userId sekarang diterima sebagai parameter
   * terpisah — diambil dari JWT token oleh controller,
   * BUKAN dari request body (eliminasi IDOR vulnerability).
   *
   * FIX [CRITICAL-03]: Validasi keamanan imageUrl dilakukan
   * di use case layer sebelum data disimpan ke database.
   */
  async execute(
    dto: CreatePredictionDto,
    authenticatedUserId: string,
  ): Promise<PredictionResponseDto> {
    // Validasi keamanan URL — cegah SSRF dan path traversal
    if (!CreatePredictionDto.isSafeImageUrl(dto.imageUrl)) {
      throw new UnprocessableEntityException(
        'imageUrl tidak valid: protokol tidak diizinkan atau ' +
          'mengarah ke alamat jaringan internal yang diblokir.',
      );
    }

    const prediction = await this.predictionRepo.create({
      // FIX [CRITICAL-02]: Gunakan authenticatedUserId dari JWT,
      // bukan dari dto — client tidak bisa menentukan userId sendiri
      userId: authenticatedUserId,
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
