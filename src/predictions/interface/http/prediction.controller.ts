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
  UseFilters,
} from '@nestjs/common';
import { PredictionOrchestrator } from '../../applications/orchestrator/prediction.orchestrator';
import { CreatePredictionDto } from '../../applications/dto/create-prediction.dto';
import { PredictionResponseDto } from '../../applications/dto/prediction-response.dto';
import { PredictionExceptionFilter } from '../filters/prediction-exception.filter';

@Controller('predictions')
@UseFilters(PredictionExceptionFilter)
export class PredictionController {
  constructor(private readonly orchestrator: PredictionOrchestrator) {}

  /**
   * POST /predictions
   * Membuat prediction record awal (status: PENDING).
   * AI processing akan dipicu via event oleh AI Integration Module.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreatePredictionDto): Promise<PredictionResponseDto> {
    return this.orchestrator.create(dto);
  }

  /**
   * GET /predictions/user/:userId
   * Mengambil semua prediction milik seorang user.
   */
  @Get('user/:userId')
  @HttpCode(HttpStatus.OK)
  getAllByUser(
    @Param('userId', new ParseUUIDPipe({ version: '4' })) userId: string,
  ): Promise<PredictionResponseDto[]> {
    return this.orchestrator.getAllByUser(userId);
  }

  /**
   * GET /predictions/:id/user/:userId
   * Mengambil satu prediction, dengan validasi kepemilikan.
   */
  @Get(':id/user/:userId')
  @HttpCode(HttpStatus.OK)
  getById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('userId', new ParseUUIDPipe({ version: '4' })) userId: string,
  ): Promise<PredictionResponseDto> {
    return this.orchestrator.getById(id, userId);
  }
}
