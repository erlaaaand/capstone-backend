// src/ai-integration/domains/validators/ai-response.validator.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { AiPredictResultDto } from '../../applications/dto/ai-predict-response.dto';

@Injectable()
export class AiResponseValidator {
  assertValidResult(result: AiPredictResultDto): void {
    this.assertVarietyCode(result.varietyCode);
    this.assertConfidenceScore(result.confidenceScore);
  }

  private assertVarietyCode(code: string): void {
    if (!code || code.trim().length === 0) {
      throw new InternalServerErrorException(
        'AI service mengembalikan variety_code kosong',
      );
    }
  }

  private assertConfidenceScore(score: number): void {
    if (typeof score !== 'number' || isNaN(score)) {
      throw new InternalServerErrorException(
        'AI service mengembalikan confidence_score yang tidak valid',
      );
    }

    if (score < 0 || score > 1) {
      throw new InternalServerErrorException(
        `confidence_score harus antara 0 dan 1, diterima: ${score}`,
      );
    }
  }
}
