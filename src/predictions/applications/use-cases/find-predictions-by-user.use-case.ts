// src/predictions/applications/use-cases/find-predictions-by-user.use-case.ts
import { Inject, Injectable } from '@nestjs/common';
import { PredictionResponseDto } from '../dto/prediction-response.dto';
import { PredictionMapper } from '../../domains/mappers/prediction.mapper';
import {
  type IPredictionRepository,
  PREDICTION_REPOSITORY_TOKEN,
} from '../../infrastructures/repositories/prediction.repository.interface';

@Injectable()
export class FindPredictionsByUserUseCase {
  constructor(
    @Inject(PREDICTION_REPOSITORY_TOKEN)
    private readonly predictionRepo: IPredictionRepository,
    private readonly mapper: PredictionMapper,
  ) {}

  async execute(userId: string): Promise<PredictionResponseDto[]> {
    const predictions = await this.predictionRepo.findAllByUserId(userId);
    return this.mapper.toResponseDtoList(predictions);
  }
}
