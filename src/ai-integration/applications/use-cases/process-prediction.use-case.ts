// src/ai-integration/applications/use-cases/process-prediction.use-case.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { AiPredictRequestDto } from '../dto/ai-predict-request.dto';
import { AiResponseMapper } from '../../domains/mappers/ai-response.mapper';
import { AiResponseValidator } from '../../domains/validators/ai-response.validator';
import {
  type IAiHttpAdapter,
  AI_HTTP_ADAPTER_TOKEN,
} from '../../infrastructures/repositories/ai-http.adapter.interface';
import {
  type IPredictionRepository,
  PREDICTION_REPOSITORY_TOKEN,
} from '../../../predictions/infrastructures/repositories/prediction.repository.interface';

@Injectable()
export class ProcessPredictionUseCase {
  private readonly logger = new Logger(ProcessPredictionUseCase.name);

  constructor(
    @Inject(AI_HTTP_ADAPTER_TOKEN)
    private readonly aiAdapter: IAiHttpAdapter,

    @Inject(PREDICTION_REPOSITORY_TOKEN)
    private readonly predictionRepo: IPredictionRepository,

    private readonly validator: AiResponseValidator,
    private readonly mapper: AiResponseMapper,
  ) {}

  async execute(request: AiPredictRequestDto): Promise<void> {
    const { predictionId } = request;

    try {
      // 1. Kirim ke FastAPI
      const rawResult = await this.aiAdapter.predict(request);

      // 2. Validasi response domain (variety_code, confidence_score, variety_name)
      this.validator.assertValidResult(rawResult);

      // 3. Map ke payload repository
      const payload = this.mapper.toPredictionResultPayload(rawResult);

      // 4. Update prediction record → SUCCESS
      await this.predictionRepo.updateResult(predictionId, payload);

      this.logger.log(
        `[ProcessPrediction] SUCCESS → id=${predictionId}, ` +
          `variety=${payload.varietyCode}, ` +
          `confidence=${payload.confidenceScore}, ` +
          `enhanced=${payload.imageEnhanced}`,
      );
    } catch (err: unknown) {
      // Narrow `unknown` ke string reason sebelum digunakan
      const reason =
        err instanceof Error ? err.message : 'Unknown error dari AI service';

      this.logger.error(
        `[ProcessPrediction] FAILED → id=${predictionId}, reason=${reason}`,
      );

      // Fire-and-forget markAsFailed — jangan re-throw agar event listener tidak crash
      await this.predictionRepo
        .markAsFailed(predictionId, reason)
        .catch((markErr: unknown) => {
          // Narrow markErr sebelum logging — mencegah ESLint no-unsafe-argument
          const markErrMessage =
            markErr instanceof Error ? markErr.message : String(markErr);

          this.logger.error(
            `[ProcessPrediction] Gagal markAsFailed → id=${predictionId}, ` +
              `reason=${markErrMessage}`,
          );
        });
    }
  }
}
