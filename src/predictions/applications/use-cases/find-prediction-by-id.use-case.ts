// src/predictions/applications/use-cases/find-prediction-by-id.use-case.ts
import { Inject, Injectable } from '@nestjs/common';
import { PredictionResponseDto } from '../dto/prediction-response.dto';
import { PredictionMapper } from '../../domains/mappers/prediction.mapper';
import { PredictionValidator } from '../../domains/validators/prediction.validator';
import {
  type IPredictionRepository,
  PREDICTION_REPOSITORY_TOKEN,
} from '../../infrastructures/repositories/prediction.repository.interface';

@Injectable()
export class FindPredictionByIdUseCase {
  constructor(
    @Inject(PREDICTION_REPOSITORY_TOKEN)
    private readonly predictionRepo: IPredictionRepository,
    private readonly validator: PredictionValidator,
    private readonly mapper: PredictionMapper,
  ) {}

  /**
   * FIX [HIGH-03]: Gunakan satu pesan error generik untuk
   * kedua kasus (tidak ditemukan DAN bukan milik user).
   *
   * Pesan yang berbeda memungkinkan attacker melakukan
   * prediction ID enumeration — mereka bisa tahu apakah
   * UUID valid atau tidak dari pesan error yang berbeda.
   *
   * Dengan pesan yang sama, attacker tidak bisa membedakan
   * "prediction tidak ada" vs "prediction ada tapi milik orang lain".
   */
  async execute(
    id: string,
    requestingUserId: string,
  ): Promise<PredictionResponseDto> {
    const prediction = await this.predictionRepo.findById(id);

    // assertExistsAndBelongsToUser menggabungkan dua validasi
    // dengan SATU pesan error generik — tidak bocorkan info
    this.validator.assertExistsAndBelongsToUser(
      prediction,
      id,
      requestingUserId,
    );

    // Type assertion aman karena assertExistsAndBelongsToUser
    // sudah memastikan prediction non-null via asserts
    return this.mapper.toResponseDto(prediction!);
  }
}
