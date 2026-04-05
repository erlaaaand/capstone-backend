// src/ai-integration/infrastructures/repositories/ai-http.adapter.interface.ts
import { AiPredictRequestDto } from '../../applications/dto/ai-predict-request.dto';
import { AiPredictResultDto } from '../../applications/dto/ai-predict-response.dto';

export interface IAiHttpAdapter {
  predict(request: AiPredictRequestDto): Promise<AiPredictResultDto>;
}

export const AI_HTTP_ADAPTER_TOKEN = Symbol('IAiHttpAdapter');
