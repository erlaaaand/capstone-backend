// src/predictions/interface/http/prediction.controller.ts
import {
  Body, Controller, Get, HttpCode, HttpStatus,
  Param, ParseUUIDPipe, Post, Query, UseFilters, UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth, ApiCreatedResponse, ApiNotFoundResponse,
  ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags,
  ApiUnauthorizedResponse, ApiUnprocessableEntityResponse,
  ApiForbiddenResponse,
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

  /**
   * POST /api/v1/predictions
   * Flow: upload gambar dulu ke /storage/upload, lalu kirim imageUrl ke sini.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:     'Buat prediksi baru',
    description:
      '**Flow lengkap:**\n' +
      '1. Upload gambar → `POST /api/v1/storage/upload` → dapat `imageUrl`\n' +
      '2. Kirim `imageUrl` ke endpoint ini\n' +
      '3. Prediksi dibuat dengan status `PENDING`\n' +
      '4. AI service memproses secara async (biasanya < 5 detik)\n' +
      '5. Ambil hasil → `GET /api/v1/predictions/:id`\n\n' +
      '**userId diambil otomatis dari JWT** — tidak perlu dikirim di body.',
  })
  @ApiCreatedResponse({
    type:        PredictionResponseDto,
    description: 'Prediksi berhasil dibuat dengan status PENDING.',
  })
  @ApiUnauthorizedResponse({ description: 'Token tidak valid atau expired.' })
  @ApiUnprocessableEntityResponse({
    description: 'imageUrl tidak valid atau mengarah ke alamat yang diblokir (SSRF protection).',
  })
  create(
    @Body() dto: CreatePredictionDto,
    @CurrentUser('sub') authenticatedUserId: string,
  ): Promise<PredictionResponseDto> {
    return this.orchestrator.create(dto, authenticatedUserId);
  }

  /**
   * GET /api/v1/predictions/user/me
   * List semua prediksi milik user yang sedang login (dengan pagination).
   */
  @Get('user/me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:     'Daftar prediksi saya',
    description:
      'Mengambil semua prediksi milik user yang sedang login dengan pagination.\n\n' +
      'Urutkan dari terbaru ke terlama.',
  })
  @ApiQuery({ name: 'page',  type: Number, required: false, example: 1,  description: 'Nomor halaman (default: 1)' })
  @ApiQuery({ name: 'limit', type: Number, required: false, example: 10, description: 'Item per halaman (default: 10, maks: 50)' })
  @ApiOkResponse({
    type:        PaginatedPredictionResponseDto,
    description: 'List prediksi berhasil diambil.',
  })
  @ApiUnauthorizedResponse({ description: 'Token tidak valid.' })
  getAllByUser(
    @CurrentUser('sub') authenticatedUserId: string,
    @Query() query: FindPredictionsQueryDto,
  ): Promise<PaginatedPredictionResponseDto> {
    return this.orchestrator.getAllByUser(authenticatedUserId, query);
  }

  /**
   * GET /api/v1/predictions/:id
   * Ambil detail prediksi. Hanya bisa akses milik sendiri.
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:     'Detail prediksi',
    description:
      'Mengambil detail prediksi berdasarkan ID.\n\n' +
      'Hanya bisa mengakses prediksi milik sendiri.\n\n' +
      '**Cek status**: jika masih `PENDING`, panggil ulang setelah beberapa detik.',
  })
  @ApiParam({
    name:        'id',
    type:        'string',
    format:      'uuid',
    description: 'UUID prediksi',
    example:     '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiOkResponse({
    type:        PredictionResponseDto,
    description: 'Detail prediksi. Periksa field `status` dan `varietyName`.',
  })
  @ApiUnauthorizedResponse({ description: 'Token tidak valid.' })
  @ApiForbiddenResponse({ description: 'Prediksi ini bukan milik Anda.' })
  @ApiNotFoundResponse({ description: 'Prediksi tidak ditemukan.' })
  getById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser('sub') requestingUserId: string,
  ): Promise<PredictionResponseDto> {
    return this.orchestrator.getById(id, requestingUserId);
  }
}
