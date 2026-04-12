// src/predictions/interface/http/prediction.controller.ts
import {
  Body, Controller, Get, HttpCode, HttpStatus,
  Param, ParseUUIDPipe, Post, Query, UseFilters, UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth, ApiCreatedResponse, ApiNotFoundResponse,
  ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags,
  ApiUnauthorizedResponse, ApiUnprocessableEntityResponse,
  ApiForbiddenResponse, ApiServiceUnavailableResponse,
} from '@nestjs/swagger';
import { PredictionOrchestrator } from '../../applications/orchestrator/prediction.orchestrator';
import { CreatePredictionDto } from '../../applications/dto/create-prediction.dto';
import {
  PaginatedPredictionResponseDto,
  PredictionResponseDto,
} from '../../applications/dto/prediction-response.dto';
import { FindPredictionsQueryDto } from '../../applications/dto/find-predictions-query.dto';
import { PredictionExceptionFilter } from '../filters/prediction-exception.filter';
import { JwtAuthGuard } from '../../../auth/interface/guards/jwt-auth.guard';
import { CurrentUser } from '../../../auth/interface/decorators/current-user.decorator';

@ApiTags('Predictions')
@ApiBearerAuth('JWT')
@Controller('predictions')
@UseFilters(PredictionExceptionFilter)
@UseGuards(JwtAuthGuard)
export class PredictionController {
  constructor(private readonly orchestrator: PredictionOrchestrator) {}

  // ── Create ─────────────────────────────────────────────────────────────────

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Buat prediksi baru',
    description:
      '**Flow lengkap:**\n\n' +
      '1. Upload gambar → `POST /api/v1/storage/upload` → dapat `imageUrl`\n' +
      '2. Kirim `imageUrl` ke endpoint ini\n' +
      '3. Prediksi dibuat dengan status `PENDING`\n' +
      '4. AI service memproses secara async (biasanya < 5 detik)\n' +
      '5. Ambil hasil → `GET /api/v1/predictions/:id`\n\n' +
      '**userId diambil otomatis dari JWT** — tidak perlu dikirim di body.\n\n' +
      '**Catatan**: Endpoint ini memerlukan AI service dalam kondisi ONLINE. ' +
      'Cek status AI terlebih dahulu via `GET /api/v1/ai/status/current`.',
    operationId: 'predictionsCreate',
  })
  @ApiCreatedResponse({
    type: PredictionResponseDto,
    description:
      'Prediksi berhasil dibuat dengan status `PENDING`. ' +
      'Poll `GET /api/v1/predictions/:id` hingga status berubah ke `SUCCESS` atau `FAILED`.',
  })
  @ApiUnauthorizedResponse({ description: 'Token tidak valid atau expired.' })
  @ApiUnprocessableEntityResponse({
    description:
      'imageUrl tidak valid, mengarah ke jaringan internal (SSRF protection), atau format tidak didukung.',
    schema: {
      example: {
        statusCode: 422,
        message: 'imageUrl tidak valid: protokol tidak diizinkan atau mengarah ke alamat jaringan internal yang diblokir.',
        error: 'UnprocessableEntityException',
      },
    },
  })
  @ApiServiceUnavailableResponse({
    description: 'AI service sedang offline atau model belum siap.',
  })
  create(
    @Body() dto: CreatePredictionDto,
    @CurrentUser('sub') authenticatedUserId: string,
  ): Promise<PredictionResponseDto> {
    return this.orchestrator.create(dto, authenticatedUserId);
  }

  // ── List my predictions ────────────────────────────────────────────────────

  @Get('user/me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Daftar prediksi saya',
    description:
      'Mengambil semua prediksi milik user yang sedang login dengan pagination.\n\n' +
      'Diurutkan dari terbaru ke terlama.\n\n' +
      '**userId diambil otomatis dari JWT.**',
    operationId: 'predictionsGetMyList',
  })
  @ApiQuery({
    name: 'page', type: Number, required: false, example: 1,
    description: 'Nomor halaman, mulai dari 1 (default: 1)',
  })
  @ApiQuery({
    name: 'limit', type: Number, required: false, example: 10,
    description: 'Jumlah item per halaman, maksimum 50 (default: 10)',
  })
  @ApiOkResponse({
    type: PaginatedPredictionResponseDto,
    description: 'List prediksi berhasil diambil dengan informasi pagination.',
  })
  @ApiUnauthorizedResponse({ description: 'Token tidak valid.' })
  getAllByUser(
    @CurrentUser('sub') authenticatedUserId: string,
    @Query() query: FindPredictionsQueryDto,
  ): Promise<PaginatedPredictionResponseDto> {
    return this.orchestrator.getAllByUser(authenticatedUserId, query);
  }

  // ── Get by ID ──────────────────────────────────────────────────────────────

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Detail prediksi',
    description:
      'Mengambil detail prediksi berdasarkan ID.\n\n' +
      '**Hanya bisa mengakses prediksi milik sendiri.**\n\n' +
      '**Cara cek hasil async:**\n' +
      '1. Buat prediksi → status `PENDING`\n' +
      '2. Panggil endpoint ini setiap 2–5 detik\n' +
      '3. Tunggu status berubah ke `SUCCESS` (hasil tersedia) atau `FAILED` (lihat `errorMessage`)\n\n' +
      '**Status yang mungkin:**\n' +
      '- `PENDING` — sedang diproses oleh AI\n' +
      '- `SUCCESS` — klasifikasi berhasil, lihat `varietyCode`, `varietyName`, `confidenceScore`\n' +
      '- `FAILED` — gagal, lihat `errorMessage` untuk detail',
    operationId: 'predictionsGetById',
  })
  @ApiParam({
    name:    'id',
    type:    'string',
    format:  'uuid',
    description: 'UUID prediksi (didapat dari response create)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiOkResponse({
    type: PredictionResponseDto,
    description: 'Detail prediksi. Periksa field `status`, `varietyCode`, dan `confidenceScore`.',
  })
  @ApiUnauthorizedResponse({ description: 'Token tidak valid.' })
  @ApiForbiddenResponse({ description: 'Prediksi ini bukan milik Anda.' })
  @ApiNotFoundResponse({
    description: 'Prediksi tidak ditemukan.',
    schema: { example: { statusCode: 404, message: "Prediction dengan id 'xxx' tidak ditemukan.", error: 'NotFoundException' } },
  })
  getById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser('sub') requestingUserId: string,
  ): Promise<PredictionResponseDto> {
    return this.orchestrator.getById(id, requestingUserId);
  }
}
