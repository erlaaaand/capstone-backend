// src/predictions/applications/use-cases/create-prediction.use-case.ts
import { Inject, Injectable } from '@nestjs/common';
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

  async execute(dto: CreatePredictionDto): Promise<PredictionResponseDto> {
    const prediction = await this.predictionRepo.create({
      userId: dto.userId,
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
