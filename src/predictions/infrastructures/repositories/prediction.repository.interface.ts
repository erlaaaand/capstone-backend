// src/predictions/infrastructures/repositories/prediction.repository.interface.ts
import { PredictionEntity } from '../../domains/entities/prediction.entity';

export interface IPredictionRepository {
  findById(id: string): Promise<PredictionEntity | null>;
  findAllByUserId(userId: string): Promise<PredictionEntity[]>;
  create(data: Partial<PredictionEntity>): Promise<PredictionEntity>;
  updateResult(
    id: string,
    result: PredictionResultPayload,
  ): Promise<PredictionEntity>;
  markAsFailed(id: string, reason: string): Promise<void>;
}

/**
 * Payload yang dikirim ke repository saat AI berhasil mengklasifikasikan gambar.
 *
 * Field baru ditambahkan agar semua informasi dari FastAPI tersimpan di DB,
 * sehingga client tidak perlu call ulang ke AI untuk mendapatkan detail varietas.
 */
export interface PredictionResultPayload {
  /** Kode resmi varietas, contoh: 'D197' */
  varietyCode: string;

  /** Nama populer varietas, contoh: 'Musang King' */
  varietyName: string;

  /** Nama lokal / alias lengkap, contoh: 'D197 / Musang King / Raja Kunyit' */
  localName: string;

  /** Asal daerah varietas, contoh: 'Malaysia (Kelantan)' */
  origin: string;

  /** Deskripsi rasa dan karakteristik fisik */
  description: string;

  /** Confidence score 0–1 dengan presisi 4 desimal */
  confidenceScore: number;

  /** Apakah enhancement pipeline (CLAHE, WB, sharpening) diterapkan */
  imageEnhanced: boolean;

  /** Waktu inferensi ONNX dalam milidetik */
  inferenceTimeMs: number;
}

export const PREDICTION_REPOSITORY_TOKEN = Symbol('IPredictionRepository');
