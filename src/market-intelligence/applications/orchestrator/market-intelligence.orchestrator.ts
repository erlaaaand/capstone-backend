// src/market-intelligence/applications/orchestrator/market-intelligence.orchestrator.ts
import { Injectable } from '@nestjs/common';
import { MarketReportDto } from '../dto/market-report.dto';
import { MarketReportIngestResponseDto } from '../dto/market-report-ingest-response.dto';
import { ProcessMarketReportUseCase } from '../use-cases/process-market-report.use-case';

@Injectable()
export class MarketIntelligenceOrchestrator {
  constructor(
    private readonly processMarketReport: ProcessMarketReportUseCase,
  ) {}

  ingestReport(dto: MarketReportDto): Promise<MarketReportIngestResponseDto> {
    return this.processMarketReport.execute(dto);
  }
}