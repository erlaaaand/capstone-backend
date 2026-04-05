// src/predictions/applications/orchestrator/prediction.orchestrator.ts
import { Injectable } from '@nestjs/common';
import { CreatePredictionDto } from '../dto/create-prediction.dto';
import { PredictionResponseDto } from '../dto/prediction-response.dto';
import { CreatePredictionUseCase } from '../use-cases/create-prediction.use-case';
import { FindPredictionByIdUseCase } from '../use-cases/find-prediction-by-id.use-case';
import { FindPredictionsByUserUseCase } from '../use-cases/find-predictions-by-user.use-case';

@Injectable()
export class PredictionOrchestrator {
  constructor(
    private readonly createPrediction: CreatePredictionUseCase,
    private readonly findById: FindPredictionByIdUseCase,
    private readonly findByUser: FindPredictionsByUserUseCase,
  ) {}

  create(dto: CreatePredictionDto): Promise<PredictionResponseDto> {
    return this.createPrediction.execute(dto);
  }

  getById(
    id: string,
    requestingUserId: string,
  ): Promise<PredictionResponseDto> {
    return this.findById.execute(id, requestingUserId);
  }

  getAllByUser(userId: string): Promise<PredictionResponseDto[]> {
    return this.findByUser.execute(userId);
  }
}
