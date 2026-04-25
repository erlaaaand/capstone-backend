// src/ai-integration/infrastructures/listeners/prediction-created.listener.ts

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PredictionCreatedEvent } from '../../../predictions/infrastructures/events/prediction-created.event';

@Injectable()
export class AiPredictionCreatedListener {
  private readonly logger = new Logger(AiPredictionCreatedListener.name);

  @OnEvent('prediction.created', { async: true })
  handlePredictionCreated(event: PredictionCreatedEvent): void {
    this.logger.log(
      `[Audit] prediction.created → ` +
        `id=${event.predictionId} | ` +
        `userId=${event.userId} | ` +
        `imageUrl=${event.imageUrl} | ` +
        `occurredAt=${event.occurredAt.toISOString()} | ` +
        `[pemrosesan AI: SYNC via CreatePredictionUseCase]`,
    );
  }
}