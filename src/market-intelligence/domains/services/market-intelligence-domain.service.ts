import { Injectable } from '@nestjs/common';
import { AgentRunStatus } from '../entities/agent-run-status.entity';

@Injectable()
export class MarketIntelligenceDomainService {
  isActionableStatus(status: AgentRunStatus): boolean {
    return (
      status === AgentRunStatus.SUCCESS ||
      status === AgentRunStatus.PARTIAL
    );
  }

  summarizeRun(
    runId:         string,
    totalEntries:  number,
    savedCount:    number,
    rejectedCount: number,
    status:        AgentRunStatus,
  ): string {
    return (
      `run_id=${runId} | status=${status} | ` +
      `total=${totalEntries} | saved=${savedCount} | rejected=${rejectedCount}`
    );
  }
}