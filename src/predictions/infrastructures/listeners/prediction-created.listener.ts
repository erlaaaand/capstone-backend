// src/predictions/infrastructures/listeners/prediction-created.listener.ts
//
// FIX [BUG-3]: File ini di-refactor menjadi LOG-ONLY listener.
//
// SEBELUM: File ini berisi AiPredictionCreatedListener dengan logika AI penuh
//   (download image, call AI service, update DB) — menduplikasi listener
//   yang sudah ada di AiIntegrationModule. Akibatnya:
//   1. Event 'prediction.created' ditangani DUA KALI
//   2. AI dipanggil dua kali per prediksi (double billing, race condition)
//   3. DI error karena AiIntegrationOrchestrator/AiHealthService tidak tersedia
//      di PredictionModule
//
// SESUDAH: Hanya logging (audit trail). Semua logika AI ada di
//   src/ai-integration/infrastructures/listeners/prediction-created.listener.ts
//   yang sudah di-register di AiIntegrationModule.

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PredictionCreatedEvent } from '../events/prediction-created.event';

/**
 * Listener ringan untuk audit trail event prediction.created.
 * Tidak melakukan operasi I/O — hanya logging.
 *
 * Logika AI (download gambar → kirim ke FastAPI → update DB)
 * sepenuhnya dihandle oleh AiPredictionCreatedListener di AiIntegrationModule.
 */
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
