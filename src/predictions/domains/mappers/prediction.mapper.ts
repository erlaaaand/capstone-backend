// src/predictions/domains/mappers/prediction.mapper.ts
import { Injectable } from '@nestjs/common';
import { PredictionResponseDto } from '../../applications/dto/prediction-response.dto';
import { PredictionEntity } from '../entities/prediction.entity';

@Injectable()
export class PredictionMapper {
  toResponseDto(entity: PredictionEntity): PredictionResponseDto {
    return {
      id: entity.id,
      userId: entity.userId,
      // ── AI Result — Core ──────────────────────────────────────
      varietyCode: entity.varietyCode,
      varietyName: entity.varietyName,
      localName: entity.localName,
      origin: entity.origin,
      description: entity.description,
      confidenceScore: entity.confidenceScore,
      // ── AI Result — Metadata ──────────────────────────────────
      imageEnhanced: entity.imageEnhanced,
      inferenceTimeMs: entity.inferenceTimeMs,
      // ── Image & Status ────────────────────────────────────────
      imageUrl: entity.imageUrl,
      status: entity.status,
      errorMessage: entity.errorMessage,
      createdAt: entity.createdAt,
    };
  }

  toResponseDtoList(entities: PredictionEntity[]): PredictionResponseDto[] {
    return entities.map((e) => this.toResponseDto(e));
  }
}
