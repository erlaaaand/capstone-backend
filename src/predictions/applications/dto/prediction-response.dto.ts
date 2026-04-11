// src/predictions/applications/dto/prediction-response.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PredictionStatus } from '../../domains/entities/prediction.entity';

export class PredictionResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'UUID prediksi' })
  id: string = '';

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001', description: 'UUID pemilik' })
  userId: string = '';

  @ApiPropertyOptional({ example: 'D197', description: 'Kode varietas DOA Malaysia' })
  varietyCode: string | null = null;

  @ApiPropertyOptional({ example: 'Musang King' })
  varietyName: string | null = null;

  @ApiPropertyOptional({ example: 'D197 / Musang King / Raja Kunyit / Mao Shan Wang' })
  localName: string | null = null;

  @ApiPropertyOptional({ example: 'Malaysia (Kelantan)' })
  origin: string | null = null;

  @ApiPropertyOptional({ example: 'Raja durian Malaysia dengan daging kuning-emas...' })
  description: string | null = null;

  @ApiPropertyOptional({
    example:     0.9231,
    description: 'Confidence score 0–1 (4 desimal)',
    minimum:     0,
    maximum:     1,
  })
  confidenceScore: number | null = null;

  @ApiPropertyOptional({ example: true, description: 'Apakah image enhancement diterapkan' })
  imageEnhanced: boolean | null = null;

  @ApiPropertyOptional({ example: 45.2, description: 'Waktu inferensi ONNX dalam ms' })
  inferenceTimeMs: number | null = null;

  @ApiProperty({ example: 'http://localhost:3000/uploads/predictions/user-id/file.jpg' })
  imageUrl: string = '';

  @ApiProperty({
    enum:        PredictionStatus,
    example:     PredictionStatus.PENDING,
    description: 'PENDING → diproses AI | SUCCESS → selesai | FAILED → gagal',
  })
  status: PredictionStatus = PredictionStatus.PENDING;

  @ApiPropertyOptional({ example: null, description: 'Pesan error jika status FAILED' })
  errorMessage: string | null = null;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: Date = new Date();
}

export class PaginatedPredictionResponseDto {
  @ApiProperty({ type: [PredictionResponseDto] })
  data: PredictionResponseDto[] = [];

  @ApiProperty({ example: 42, description: 'Total prediksi milik user' })
  total: number = 0;

  @ApiProperty({ example: 1 })
  page: number = 1;

  @ApiProperty({ example: 10 })
  limit: number = 10;

  @ApiProperty({ example: 5, description: 'Total halaman' })
  totalPages: number = 0;
}
