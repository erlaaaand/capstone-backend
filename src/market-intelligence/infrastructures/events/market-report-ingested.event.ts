// src/market-intelligence/infrastructures/events/market-report-ingested.event.ts
import { AgentRunStatus } from '../../domains/entities/agent-run-status.entity';

export class MarketReportIngestedEvent {
  constructor(
    public readonly runId:        string,
    public readonly agentVersion: string,
    public readonly status:       AgentRunStatus,
    public readonly savedCount:   number,
    public readonly occurredAt:   Date,
  ) {}
}