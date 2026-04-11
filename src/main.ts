// src/main.ts
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { setupSwagger } from './swagger.config';

const JSON_BODY_LIMIT = '1mb';

function buildCorsOrigins(
  config: ConfigService,
  nodeEnv: string,
): string | string[] | boolean {
  if (nodeEnv === 'production') {
    const raw = config.get<string>('ALLOWED_ORIGINS', '');
    if (!raw || raw.trim().length === 0) {
      throw new Error(
        '❌ ALLOWED_ORIGINS wajib diisi di environment production.',
      );
    }
    return raw
      .split(',')
      .map((o) => o.trim())
      .filter((o) => o.length > 0);
  }
  return '*';
}

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger:
      process.env.NODE_ENV === 'production'
        ? ['error', 'warn', 'log']
        : ['error', 'warn', 'log', 'debug', 'verbose'],
    abortOnError: false,
  });

  const config  = app.get(ConfigService);
  const port    = config.getOrThrow<number>('PORT');
  const nodeEnv = config.getOrThrow<string>('NODE_ENV');

  // ── Security Headers ─────────────────────────────────────────
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc:              ["'self'"],
          scriptSrc:               ["'self'"],
          styleSrc:                ["'self'", "'unsafe-inline'"], // Swagger UI butuh inline style
          imgSrc:                  ["'self'", 'data:', 'blob:'],
          connectSrc:              ["'self'"],
          fontSrc:                 ["'self'", 'data:'],
          objectSrc:               ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
      strictTransportSecurity:
        nodeEnv === 'production'
          ? { maxAge: 31_536_000, includeSubDomains: true, preload: true }
          : false,
      frameguard:       { action: 'deny' },
      hidePoweredBy:    true,
      noSniff:          true,
      xssFilter:        true,
      ieNoOpen:         true,
      referrerPolicy:   { policy: 'strict-origin-when-cross-origin' },
    }),
  );

  app.use(compression());
  app.useBodyParser('json',       { limit: JSON_BODY_LIMIT });
  app.useBodyParser('urlencoded', { limit: JSON_BODY_LIMIT, extended: true });
  app.setGlobalPrefix('api/v1');

  // ── CORS ─────────────────────────────────────────────────────
  const corsOrigins = buildCorsOrigins(config, nodeEnv);
  app.enableCors({
    origin:         corsOrigins,
    methods:        ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['X-Request-Id'],
    credentials:    nodeEnv === 'production',
    maxAge:         86_400,
  });

  // ── Global Exception Filter ──────────────────────────────────
  // FIX: Mencegah stack trace dan pesan error internal bocor ke client
  app.useGlobalFilters(new GlobalExceptionFilter());

  // ── Global Validation Pipe ───────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist:            true,
      forbidNonWhitelisted: true,
      transform:            true,
      transformOptions: {
        enableImplicitConversion: true,
        exposeDefaultValues:      true,
      },
      stopAtFirstError:     false,
      disableErrorMessages: false,
    }),
  );

  // ── Swagger / OpenAPI ────────────────────────────────────────
  // Aktif di development dan staging — nonaktifkan di production
  // dengan set ENABLE_SWAGGER=false di env
  const enableSwagger = config.get<string>('ENABLE_SWAGGER', 'true');
  if (nodeEnv !== 'production' || enableSwagger === 'true') {
    setupSwagger(app);
    logger.log(`📖 Swagger docs: http://0.0.0.0:${port}/api/docs`);
  }

  if (nodeEnv === 'production') {
    app.set('trust proxy', 1);
  }

  app.enableShutdownHooks();

  const shutdown = (signal: string): void => {
    logger.warn(`[Shutdown] ${signal} received — graceful shutdown...`);
    app
      .close()
      .then(() => { logger.log('[Shutdown] Closed cleanly.'); process.exit(0); })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        logger.error(`[Shutdown] Error: ${msg}`);
        process.exit(1);
      });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));

  await app.listen(port, '0.0.0.0');

  logger.log('─'.repeat(60));
  logger.log(`🚀 Started in [${nodeEnv}] mode`);
  logger.log(`🌐 http://0.0.0.0:${port}/api/v1`);
  logger.log(`🤖 AI: ${config.get<string>('FASTAPI_BASE_URL', 'NOT SET')}`);
  logger.log(`🔒 CORS: ${JSON.stringify(corsOrigins)}`);
  if (nodeEnv !== 'production') {
    logger.warn('⚠️  [DEV] TypeORM synchronize ON — jangan di production!');
  }
  logger.log('─'.repeat(60));
}

bootstrap().catch((err: unknown) => {
  const logger = new Logger('Bootstrap');
  const msg    = err instanceof Error ? err.message : String(err);
  const stack  = err instanceof Error ? err.stack   : undefined;
  logger.error(`❌ Fatal bootstrap error: ${msg}`, stack);
  process.exit(1);
});