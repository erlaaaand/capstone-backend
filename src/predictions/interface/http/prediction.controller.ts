// src/predictions/interface/http/prediction.controller.ts
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { PredictionOrchestrator } from '../../applications/orchestrator/prediction.orchestrator';
import { CreatePredictionDto } from '../../applications/dto/create-prediction.dto';
import {
  PaginatedPredictionResponseDto,
  PredictionResponseDto,
} from '../../applications/dto/prediction-response.dto';
import { FindPredictionsQueryDto } from '../../applications/dto/find-predictions-query.dto';
import { PredictionExceptionFilter } from '../filters/prediction-exception.filter';
import { JwtAuthGuard } from '../../../auth/interface/guards/jwt-auth.guard';
import {
  CurrentUser,
} from '../../../auth/interface/decorators/current-user.decorator';

@Controller('predictions')
@UseFilters(PredictionExceptionFilter)
@UseGuards(JwtAuthGuard) // FIX: Semua endpoint wajib terautentikasi
export class PredictionController {
  constructor(private readonly orchestrator: PredictionOrchestrator) {}

  /**
   * POST /predictions
   *
   * FIX [CRITICAL-02]: userId tidak lagi diambil dari request body.
   * @CurrentUser('sub') mengekstrak userId dari JWT payload yang sudah
   * diverifikasi oleh JwtAuthGuard — client tidak bisa memanipulasinya.
   *
   * FIX sebelumnya: this.orchestrator.create(dto) — tidak passing userId,
   * menyebabkan TypeError karena parameter wajib tidak terpenuhi.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreatePredictionDto,
    @CurrentUser('sub') authenticatedUserId: string,
  ): Promise<PredictionResponseDto> {
    return this.orchestrator.create(dto, authenticatedUserId);
  }

  /**
   * GET /predictions/user/me
   *
   * FIX [CRITICAL-02] + [INFO-03]:
   * 1. userId sekarang dari JWT — bukan dari URL param (eliminasi IDOR).
   *    Endpoint lama GET /predictions/user/:userId memungkinkan user A
   *    mengakses prediksi user B hanya dengan mengganti userId di URL.
   * 2. Tambah @Query() untuk menerima parameter pagination (page, limit).
   * 3. Return type diperbaiki dari PredictionResponseDto[] menjadi
   *    PaginatedPredictionResponseDto agar sesuai dengan orchestrator.
   *
   * FIX sebelumnya:
   *   - @Param('userId') — IDOR vulnerability
   *   - this.orchestrator.getAllByUser(userId) — argumen query tidak dikirim
   *   - Return type: Promise<PredictionResponseDto[]> — tidak cocok dengan
   *     return value orchestrator (PaginatedPredictionResponseDto)
   */
  @Get('user/me')
  @HttpCode(HttpStatus.OK)
  getAllByUser(
    @CurrentUser('sub') authenticatedUserId: string,
    @Query() query: FindPredictionsQueryDto,
  ): Promise<PaginatedPredictionResponseDto> {
    return this.orchestrator.getAllByUser(authenticatedUserId, query);
  }

  /**
   * GET /predictions/:id
   *
   * FIX [CRITICAL-02] + [HIGH-03]:
   * 1. userId sekarang dari JWT — bukan dari URL param (:userId).
   *    Endpoint lama GET /predictions/:id/user/:userId memungkinkan
   *    attacker melakukan prediction ID enumeration dengan menguji
   *    berbagai kombinasi id + userId.
   * 2. requestingUserId diambil dari token yang sudah diverifikasi.
   *
   * FIX sebelumnya: @Param('userId') — membocorkan apakah UUID valid
   * atau tidak berdasarkan respons berbeda dari server.
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  getById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser('sub') requestingUserId: string,
  ): Promise<PredictionResponseDto> {
    return this.orchestrator.getById(id, requestingUserId);
  }
}
