// src/ai-integration/infrastructures/health/ai-health.controller.ts
import { Controller, Get, Logger, MessageEvent, Sse } from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { AiHealthService, type AiStatusSnapshot } from './ai-health.service';

// ── Controller ────────────────────────────────────────────────────────────────

/**
 * Endpoint SSE untuk streaming status AI ke frontend secara real-time.
 *
 * Frontend melakukan GET /api/v1/ai/status dengan header:
 *   Accept: text/event-stream
 *
 * Tidak memerlukan autentikasi JWT agar frontend publik bisa memantau
 * status AI tanpa token — sesuaikan dengan kebutuhan jika perlu di-protect.
 */
@Controller('ai')
export class AiHealthController {
  private readonly logger = new Logger(AiHealthController.name);

  constructor(private readonly aiHealthService: AiHealthService) {}

  /**
   * GET /api/v1/ai/status
   *
   * Server-Sent Events endpoint.
   * - Subscriber baru LANGSUNG mendapat snapshot terkini (karena BehaviorSubject).
   * - Setiap kali Cron Job mengupdate state, semua subscriber aktif menerima event baru.
   * - Koneksi tetap terbuka sampai client disconnect.
   */
  @Sse('status')
  streamAiStatus(): Observable<MessageEvent> {
    this.logger.log('[SSE] Client baru terhubung ke /api/v1/ai/status');

    return this.aiHealthService.status$.pipe(
      map((snapshot: AiStatusSnapshot): MessageEvent => {
        return {
          // `data` akan di-serialize menjadi JSON oleh NestJS SSE handler
          data: snapshot,
          // `type` menjadi field `event:` di SSE protocol —
          // frontend bisa filter: eventSource.addEventListener('ai-status', ...)
          type: 'ai-status',
          // `id` membantu browser reconnect dari event terakhir yang diterima
          id: snapshot.checkedAt,
        };
      }),
    );
  }

  /**
   * GET /api/v1/ai/status/current
   *
   * REST endpoint biasa (non-streaming) untuk polling satu kali.
   * Berguna untuk initial load di frontend sebelum SSE terhubung.
   */
  @Get('status/current')
  getCurrentStatus(): AiStatusSnapshot {
    return this.aiHealthService.getCurrentStatus();
  }
}
