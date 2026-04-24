import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import {
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiForbiddenResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { MarketIntelligenceOrchestrator } from '../../applications/orchestrator/market-intelligence.orchestrator';
import { MarketReportDto } from '../../applications/dto/market-report.dto';
import { MarketReportIngestResponseDto } from '../../applications/dto/market-report-ingest-response.dto';
import { HmacSignatureGuard } from '../../infrastructures/guards/hmac-signature.guard';
import { MarketIntelligenceExceptionFilter } from '../filters/market-intelligence-exception.filter';
import { Public } from '../../../auth/interface/decorators/public.decorator';

@ApiTags('Market Intelligence')
@Controller('ai-integration')
@UseFilters(MarketIntelligenceExceptionFilter)
export class MarketIntelligenceController {
  private readonly logger = new Logger(MarketIntelligenceController.name);

  constructor(private readonly orchestrator: MarketIntelligenceOrchestrator) {}

  @Public()
  @Post('market-report')
  @HttpCode(HttpStatus.OK)
  @UseGuards(HmacSignatureGuard)
  @ApiOperation({
    summary:     'Terima laporan harga pasar dari Market Intelligence Agent',
    description:
      'Endpoint internal yang menerima laporan harga durian utuh dari agen Python.\n\n' +
      '**Autentikasi:** HMAC-SHA256 signature via header `X-Signature`.\n\n' +
      'Format signature: `sha256=<hex_digest>` dihitung dari request body ' +
      'menggunakan `NESTJS_INTERNAL_API_KEY`.\n\n' +
      '**Filter data:** Hanya entri dengan `is_whole_fruit=true` yang disimpan.',
    operationId: 'marketIntelligenceIngestReport',
  })
  @ApiHeader({
    name:        'X-Signature',
    description: 'HMAC-SHA256 signature. Format: `sha256=<hex_digest>`.',
    required:    true,
  })
  @ApiHeader({
    name:        'X-Agent-Version',
    description: 'Versi agen yang mengirim laporan.',
    required:    false,
  })
  @ApiOkResponse({
    type:        MarketReportIngestResponseDto,
    description: 'Laporan berhasil diterima dan diproses.',
  })
  @ApiForbiddenResponse({
    description: 'Signature HMAC tidak valid atau tidak ada.',
    schema: {
      example: {
        statusCode: 403,
        message:    'Signature HMAC tidak valid. Request ditolak.',
        error:      'ForbiddenException',
        module:     'market-intelligence',
      },
    },
  })
  @ApiUnprocessableEntityResponse({
    description: 'Payload tidak lolos validasi DTO.',
  })
  async ingestReport(
    @Body() dto: MarketReportDto,
  ): Promise<MarketReportIngestResponseDto> {
    this.logger.log(
      `[MarketIntelligenceController] ingestReport → ` +
        `run_id=${dto.run_id}, ` +
        `status=${dto.status}, ` +
        `entries=${dto.entries.length}`,
    );

    return this.orchestrator.ingestReport(dto);
  }
}
