// src/predictions/domains/validators/prediction.validator.ts
import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PredictionEntity } from '../entities/prediction.entity';

@Injectable()
export class PredictionValidator {
  /**
   * FIX [MEDIUM-01] + [HIGH-03]: Gabungkan assertExists dan
   * assertBelongsToUser menjadi satu method dengan pesan generik.
   *
   * Dua pesan error berbeda untuk "tidak ada" vs "bukan milik user"
   * memungkinkan prediction ID enumeration attack.
   *
   * Dengan satu pesan generik, attacker tidak bisa membedakan
   * kedua kasus tersebut.
   *
   * Type predicate 'asserts prediction is PredictionEntity'
   * memastikan TypeScript tahu bahwa setelah method ini dipanggil,
   * prediction pasti non-null — eliminasi non-null assertion (!) di caller.
   */
  assertExistsAndBelongsToUser(
    prediction: PredictionEntity | null,
    id: string,
    userId: string,
  ): asserts prediction is PredictionEntity {
    // Satu pesan error untuk kedua kasus — tidak bocorkan informasi
    const genericMessage = `Prediction dengan id '${id}' tidak ditemukan.`;

    if (prediction === null || prediction === undefined) {
      throw new NotFoundException(genericMessage);
    }

    if (prediction.userId !== userId) {
      // Sama-sama NotFoundException — bukan ForbiddenException
      // agar attacker tidak bisa membedakan "tidak ada" vs "bukan milik"
      throw new NotFoundException(genericMessage);
    }
  }

  /**
   * Pertahankan assertExists untuk use case internal yang tidak
   * memerlukan validasi kepemilikan (misalnya: AI processing).
   *
   * FIX [MEDIUM-01]: Tambah type guard yang eksplisit.
   */
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

  /**
   * Pertahankan assertBelongsToUser sebagai method terpisah
   * untuk kasus di mana kepemilikan perlu dicek setelah
   * assertExists sudah dipanggil (internal use case).
   *
   * FIX [MEDIUM-01]: Tambah parameter type yang lebih ketat —
   * method ini hanya boleh dipanggil setelah assertExists.
   */
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
