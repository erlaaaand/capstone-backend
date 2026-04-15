// src/predictions/infrastructures/listeners/prediction-created.listener.ts
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PredictionCreatedEvent } from '../events/prediction-created.event';

@Injectable()
export class PredictionCreatedLogListener {
  private readonly logger = new Logger(PredictionCreatedLogListener.name);

  @OnEvent('prediction.created', { async: true })
  handlePredictionCreated(event: PredictionCreatedEvent): void {
    this.logger.log(
      `[EVENT] prediction.created → ` +
        `id=${event.predictionId}, ` +
        `userId=${event.userId}, ` +
        `imageUrl=${event.imageUrl}, ` +
        `occurredAt=${event.occurredAt.toISOString()}`,
    );
  }
}
