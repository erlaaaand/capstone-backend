// src/ai-integration/infrastructures/health/ai-health.controller.ts
import { Controller, Get, Logger, MessageEvent, Sse } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiExtraModels,
  getSchemaPath,
} from '@nestjs/swagger';
import { Observable, map } from 'rxjs';
import { AiHealthService, type AiStatusSnapshot } from './ai-health.service';
import { Public } from '../../../auth/interface/decorators/public.decorator';

// ── Controller ────────────────────────────────────────────────────────────────

/**
 * Endpoint SSE & REST untuk status AI service.
 *
 * FIX [BUG-5]: Semua endpoint di sini diberi @Public() agar bisa diakses
 * tanpa JWT token. Health check harus bisa diakses oleh:
 * - Frontend sebelum user login (untuk menampilkan banner "AI sedang offline")
 * - Monitoring tools (Grafana, Uptime Kuma, dsb.)
 * - Load balancer health probe
 *
 * Sebelumnya (setelah JwtAuthGuard dijadikan APP_GUARD global di AppModule),
 * endpoint ini akan mengembalikan 401 karena tidak ada @Public() decorator.
 */
@ApiTags('AI Health')
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
   *
   * Cara konsumsi di frontend:
   * ```javascript
   * const es = new EventSource('/api/v1/ai/status');
   * es.addEventListener('ai-status', (e) => {
   *   const snapshot = JSON.parse(e.data);
   *   console.log(snapshot.status, snapshot.modelLoaded);
   * });
   * ```
   */
  @Public()
  @Sse('status')
  @ApiOperation({
    summary: 'Stream status AI (SSE)',
    description:
      '**Server-Sent Events** — koneksi tetap terbuka, server push setiap 10 detik.\n\n' +
      'Gunakan `EventSource` di browser atau library SSE di mobile.\n\n' +
      'Event type: `ai-status`\n\n' +
      '```\nAccept: text/event-stream\n```\n\n' +
      '**Tidak memerlukan autentikasi** — dapat diakses publik untuk monitoring.',
  })
  @ApiOkResponse({
    description: 'Stream SSE `ai-status` event. Setiap event berisi AiStatusSnapshot.',
    content: {
      'text/event-stream': {
        schema: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['ONLINE', 'OFFLINE'],
              example: 'ONLINE',
            },
            checkedAt: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T10:30:00.000Z',
            },
            message: {
              type: 'string',
              example: 'AI service online dan model siap.',
            },
            modelLoaded: {
              type: 'boolean',
              example: true,
            },
            uptimeSeconds: {
              type: 'number',
              nullable: true,
              example: 3600,
            },
          },
        },
      },
    },
  })
  streamAiStatus(): Observable<MessageEvent> {
    this.logger.log('[SSE] Client baru terhubung ke /api/v1/ai/status');

    return this.aiHealthService.status$.pipe(
      map((snapshot: AiStatusSnapshot): MessageEvent => {
        return {
          data: snapshot,
          type: 'ai-status',
          id: snapshot.checkedAt,
        };
      }),
    );
  }

  /**
   * GET /api/v1/ai/status/current
   *
   * REST endpoint biasa (non-streaming) untuk polling satu kali.
   * Berguna untuk initial load di frontend sebelum SSE terhubung,
   * atau untuk health probe dari load balancer.
   */
  @Public()
  @Get('status/current')
  @ApiOperation({
    summary: 'Status AI saat ini (REST)',
    description:
      'One-shot REST endpoint untuk memeriksa status AI tanpa membuka koneksi SSE.\n\n' +
      'Gunakan ini untuk:\n' +
      '- Initial load sebelum SSE terhubung\n' +
      '- Health probe dari load balancer / monitoring\n' +
      '- Cek cepat via cURL/Postman\n\n' +
      '**Tidak memerlukan autentikasi.**',
  })
  @ApiOkResponse({
    description: 'Snapshot status AI terkini.',
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['ONLINE', 'OFFLINE'],
          example: 'ONLINE',
          description: 'Status koneksi ke FastAPI',
        },
        checkedAt: {
          type: 'string',
          format: 'date-time',
          example: '2024-01-15T10:30:00.000Z',
          description: 'Waktu health check terakhir (ISO 8601 UTC)',
        },
        message: {
          type: 'string',
          example: 'AI service online dan model siap.',
          description: 'Deskripsi status detail',
        },
        modelLoaded: {
          type: 'boolean',
          example: true,
          description: 'true jika model ONNX sudah ter-load dan siap inferensi',
        },
        uptimeSeconds: {
          type: 'number',
          nullable: true,
          example: 3600,
          description: 'Uptime FastAPI dalam detik, null jika offline',
        },
      },
      required: ['status', 'checkedAt', 'message', 'modelLoaded'],
    },
  })
  getCurrentStatus(): AiStatusSnapshot {
    return this.aiHealthService.getCurrentStatus();
  }
}
