// src/predictions/infrastructures/listeners/prediction-created.listener.ts
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PredictionCreatedEvent } from '../events/prediction-created.event';

/**
 * Listener sederhana di PredictionModule — hanya untuk logging audit.
 * AI processing ditangani oleh AiPredictionCreatedListener
 * yang berada di AiIntegrationModule.
 */
@Injectable()
export class PredictionCreatedListener {
  private readonly logger = new Logger(PredictionCreatedListener.name);

  @OnEvent('prediction.created', { async: true })
  handlePredictionCreated(event: PredictionCreatedEvent): void {
    this.logger.log(
      `[EVENT] prediction.created → id=${event.predictionId}, userId=${event.userId}`,
    );
  }
}
