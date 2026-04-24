export enum AgentRunStatus {
  SUCCESS       = 'success',
  PARTIAL       = 'partial',
  SCRAPER_ERROR = 'scraper_error',
  LLM_ERROR     = 'llm_error',
  NO_DATA       = 'no_data',
}