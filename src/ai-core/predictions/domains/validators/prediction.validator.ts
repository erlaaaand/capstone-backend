// src/predictions/domains/validators/prediction.validator.ts
import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PredictionEntity } from '../entities/prediction.entity';

@Injectable()
export class PredictionValidator {
  assertExistsAndBelongsToUser(
    prediction: PredictionEntity | null,
    id: string,
    userId: string,
  ): asserts prediction is PredictionEntity {
    const genericMessage = `Prediction dengan id '${id}' tidak ditemukan.`;

    if (prediction === null || prediction === undefined) {
      throw new NotFoundException(genericMessage);
    }

    if (prediction.userId !== userId) {
      throw new NotFoundException(genericMessage);
    }
  }

  assertExists(
    prediction: PredictionEntity | null,
    id: string,
  ): asserts prediction is PredictionEntity {
    if (prediction === null || prediction === undefined) {
      throw new NotFoundException(
        `Prediction dengan id '${id}' tidak ditemukan.`,
      );
    }
  }

  assertBelongsToUser(prediction: PredictionEntity, userId: string): void {
    if (prediction.userId !== userId) {
      throw new NotFoundException(
        `Prediction dengan id '${prediction.id}' tidak ditemukan.`,
      );
    }
  }

  assertValidImageMimeType(mimeType: string): void {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(mimeType)) {
      throw new UnprocessableEntityException(
        `Tipe file tidak didukung: '${mimeType}'. ` +
          `Gunakan: ${allowed.join(', ')}`,
      );
    }
  }

  assertValidImageSize(sizeInBytes: number, maxMb: number = 5): void {
    const maxBytes = maxMb * 1024 * 1024;
    if (sizeInBytes > maxBytes) {
      throw new UnprocessableEntityException(
        `Ukuran file melebihi batas maksimum ${maxMb}MB`,
      );
    }
  }
}
