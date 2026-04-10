// src/predictions/applications/orchestrator/prediction.orchestrator.ts
import { Injectable } from '@nestjs/common';
import { CreatePredictionDto } from '../dto/create-prediction.dto';
import {
  PaginatedPredictionResponseDto,
  PredictionResponseDto,
} from '../dto/prediction-response.dto';
import { FindPredictionsQueryDto } from '../dto/find-predictions-query.dto';
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

  /**
   * FIX [CRITICAL-02]: Tambah parameter authenticatedUserId
   * yang akan di-pass dari controller via @CurrentUser() decorator.
   */
  create(
    dto: CreatePredictionDto,
    authenticatedUserId: string,
  ): Promise<PredictionResponseDto> {
    return this.createPrediction.execute(dto, authenticatedUserId);
  }

  getById(
    id: string,
    requestingUserId: string,
  ): Promise<PredictionResponseDto> {
    return this.findById.execute(id, requestingUserId);
  }

  /**
   * FIX [INFO-03]: Tambah parameter query untuk pagination.
   */
  getAllByUser(
    userId: string,
    query: FindPredictionsQueryDto,
  ): Promise<PaginatedPredictionResponseDto> {
    return this.findByUser.execute(userId, query);
  }
}
