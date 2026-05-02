// src/market-intelligence/infrastructures/listeners/market-report-ingested.listener.ts
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MarketReportIngestedEvent } from '../events/market-report-ingested.event';

@Injectable()
export class MarketReportIngestedListener {
  private readonly logger = new Logger(MarketReportIngestedListener.name);

  @OnEvent('market-intelligence.report_ingested', { async: true })
  handleMarketReportIngested(event: MarketReportIngestedEvent): void {
    this.logger.log(
      `[EVENT] market-intelligence.report_ingested → ` +
        `run_id=${event.runId}, ` +
        `agent_version=${event.agentVersion}, ` +
        `status=${event.status}, ` +
        `saved=${event.savedCount}, ` +
        `occurredAt=${event.occurredAt.toISOString()}`,
    );
  }
}