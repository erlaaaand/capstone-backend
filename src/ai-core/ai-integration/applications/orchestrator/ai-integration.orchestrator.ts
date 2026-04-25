// src/ai-integration/applications/orchestrator/ai-integration.orchestrator.ts
import { Injectable } from '@nestjs/common';
import { AiPredictRequestDto } from '../dto/ai-predict-request.dto';
import { ProcessPredictionUseCase } from '../use-cases/process-prediction.use-case';

@Injectable()
export class AiIntegrationOrchestrator {
  constructor(private readonly processPrediction: ProcessPredictionUseCase) {}

  process(request: AiPredictRequestDto): Promise<void> {
    return this.processPrediction.execute(request);
  }
}
