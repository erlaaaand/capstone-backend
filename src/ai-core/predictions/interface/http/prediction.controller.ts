// src/predictions/interface/http/prediction.controller.ts
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Logger,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
  ApiForbiddenResponse,
  ApiServiceUnavailableResponse,
} from '@nestjs/swagger';
import { PredictionOrchestrator } from '../../applications/orchestrator/prediction.orchestrator';
import { CreatePredictionDto } from '../../applications/dto/create-prediction.dto';
import {
  PaginatedPredictionResponseDto,
  PredictionResponseDto,
} from '../../applications/dto/prediction-response.dto';
import { FindPredictionsQueryDto } from '../../applications/dto/find-predictions-query.dto';
import { PredictionExceptionFilter } from '../filters/prediction-exception.filter';
import { JwtAuthGuard } from '../../../../identity/auth/interface/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../identity/auth/interface/decorators/current-user.decorator';

@ApiTags('Predictions')
@ApiBearerAuth('JWT')
@Controller('predictions')
@UseFilters(PredictionExceptionFilter)
@UseGuards(JwtAuthGuard)
export class PredictionController {
  private readonly logger = new Logger(PredictionController.name);

  constructor(private readonly orchestrator: PredictionOrchestrator) {}

  // ── Create ─────────────────────────────────────────────────────────────────

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:     'Buat prediksi baru',
    description:
      '**Flow lengkap:**\n\n' +
      '1. Upload gambar → `POST /api/v1/storage/upload` → dapat `imageUrl`\n' +
      '2. Kirim `imageUrl` ke endpoint ini\n' +
      '3. Prediksi dibuat dengan status `PENDING`\n' +
      '4. AI service memproses secara async (biasanya < 5 detik)\n' +
      '5. Ambil hasil → `GET /api/v1/predictions/:id`\n\n' +
      '**userId diambil otomatis dari JWT** — tidak perlu dikirim di body.',
    operationId: 'predictionsCreate',
  })
  @ApiCreatedResponse({
    type:        PredictionResponseDto,
    description: 'Prediksi berhasil dibuat dengan status `PENDING`.',
  })
  @ApiUnauthorizedResponse({ description: 'Token tidak valid atau expired.' })
  @ApiUnprocessableEntityResponse({
    description: 'imageUrl tidak valid atau mengarah ke jaringan internal.',
  })
  @ApiServiceUnavailableResponse({
    description: 'AI service sedang offline atau model belum siap.',
  })
  create(
    @Body() dto: CreatePredictionDto,
    @CurrentUser('sub') authenticatedUserId: string,
  ): Promise<PredictionResponseDto> {
    if (!authenticatedUserId || authenticatedUserId.trim().length === 0) {
      this.logger.error(
        '[PredictionController] authenticatedUserId kosong dari @CurrentUser("sub"). ' +
          'Kemungkinan dist/ stale. Jalankan: rmdir /s /q dist && npm run build',
      );
      throw new InternalServerErrorException(
        'Gagal mengidentifikasi user dari token. ' +
          'Coba logout, login kembali, dan pastikan server di-rebuild.',
      );
    }

    this.logger.debug(
      `[PredictionController] create → userId=${authenticatedUserId}`,
    );

    return this.orchestrator.create(dto, authenticatedUserId);
  }

  // ── List my predictions ────────────────────────────────────────────────────

  @Get('user/me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:     'Daftar prediksi saya',
    description: 'Mengambil semua prediksi milik user yang sedang login dengan pagination.',
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
    type:        PaginatedPredictionResponseDto,
    description: 'List prediksi berhasil diambil.',
  })
  @ApiUnauthorizedResponse({ description: 'Token tidak valid.' })
  getAllByUser(
    @CurrentUser('sub') authenticatedUserId: string,
    @Query() query: FindPredictionsQueryDto,
  ): Promise<PaginatedPredictionResponseDto> {
    if (!authenticatedUserId || authenticatedUserId.trim().length === 0) {
      throw new InternalServerErrorException(
        'Gagal mengidentifikasi user dari token. Coba logout dan login kembali.',
      );
    }
    return this.orchestrator.getAllByUser(authenticatedUserId, query);
  }

  // ── Get by ID ──────────────────────────────────────────────────────────────

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:     'Detail prediksi',
    description:
      'Mengambil detail prediksi berdasarkan ID.\n\n' +
      '**Hanya bisa mengakses prediksi milik sendiri.**',
    operationId: 'predictionsGetById',
  })
  @ApiParam({
    name: 'id', type: 'string', format: 'uuid',
    description: 'UUID prediksi',
    example:     '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiOkResponse({ type: PredictionResponseDto })
  @ApiUnauthorizedResponse({ description: 'Token tidak valid.' })
  @ApiForbiddenResponse({ description: 'Prediksi ini bukan milik Anda.' })
  @ApiNotFoundResponse({ description: 'Prediksi tidak ditemukan.' })
  getById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser('sub') requestingUserId: string,
  ): Promise<PredictionResponseDto> {
    if (!requestingUserId || requestingUserId.trim().length === 0) {
      throw new InternalServerErrorException(
        'Gagal mengidentifikasi user dari token. Coba logout dan login kembali.',
      );
    }
    return this.orchestrator.getById(id, requestingUserId);
  }
}
