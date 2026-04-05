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
      varietyCode: entity.varietyCode,
      confidenceScore: entity.confidenceScore,
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
