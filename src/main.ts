// src/main.ts
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';

// ── Konstanta Bootstrap ───────────────────────────────────────────────────────
const JSON_BODY_LIMIT = '1mb';

function buildCorsOrigins(
  config: ConfigService,
  nodeEnv: string,
): string | string[] | boolean {
  if (nodeEnv === 'production') {
    const raw = config.get<string>('ALLOWED_ORIGINS', '');

    if (!raw || raw.trim().length === 0) {
      throw new Error(
        '❌ ALLOWED_ORIGINS wajib diisi di environment production. ' +
          'Contoh: ALLOWED_ORIGINS=https://app.example.com',
      );
    }

    return raw
      .split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0);
  }

  return '*';
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger:
      process.env.NODE_ENV === 'production'
        ? ['error', 'warn', 'log']
        : ['error', 'warn', 'log', 'debug', 'verbose'],

    abortOnError: false,
  });

  const config = app.get(ConfigService);
  const port = config.getOrThrow<number>('PORT');
  const nodeEnv = config.getOrThrow<string>('NODE_ENV');

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'blob:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
      strictTransportSecurity:
        nodeEnv === 'production'
          ? { maxAge: 31_536_000, includeSubDomains: true, preload: true }
          : false,
      frameguard: { action: 'deny' },
      hidePoweredBy: true,
      noSniff: true,
      xssFilter: true,
      ieNoOpen: true,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    }),
  );

  app.use(compression());

  app.useBodyParser('json', { limit: JSON_BODY_LIMIT });
  app.useBodyParser('urlencoded', { limit: JSON_BODY_LIMIT, extended: true });

  app.setGlobalPrefix('api/v1');

  const corsOrigins = buildCorsOrigins(config, nodeEnv);

  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['X-Request-Id'],
    credentials: nodeEnv === 'production',
    maxAge: 86_400,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
        exposeDefaultValues: true,
      },
      stopAtFirstError: false,
      disableErrorMessages: false,
    }),
  );

  if (nodeEnv === 'production') {
    app.set('trust proxy', 1);
  }

  app.enableShutdownHooks();

  const shutdown = (signal: string): void => {
    logger.warn(
      `[Shutdown] Received ${signal} — starting graceful shutdown...`,
    );

    app
      .close()
      .then((): void => {
        logger.log('[Shutdown] Application closed cleanly.');
        process.exit(0);
      })
      .catch((err: unknown): void => {
        const message = err instanceof Error ? err.message : String(err);
        logger.error(`[Shutdown] Error during shutdown: ${message}`);
        process.exit(1);
      });
  };

  process.on('SIGTERM', (): void => shutdown('SIGTERM'));
  process.on('SIGINT', (): void => shutdown('SIGINT'));

  await app.listen(port, '0.0.0.0');

  logger.log('─'.repeat(60));
  logger.log(`🚀 Application started in [${nodeEnv}] mode`);
  logger.log(`🌐 Listening on: http://0.0.0.0:${port}/api/v1`);
  logger.log(
    `🗄️  Storage provider: ${config.get<string>('STORAGE_PROVIDER', 'local')}`,
  );
  logger.log(
    `🤖 AI service URL: ${config.get<string>('FASTAPI_BASE_URL', 'NOT SET')}`,
  );
  logger.log(`🔒 CORS origins: ${JSON.stringify(corsOrigins)}`);

  if (nodeEnv !== 'production') {
    logger.warn(
      '⚠️  [DEV MODE] TypeORM synchronize: ON — ' +
        'schema akan auto-update mengikuti entity. ' +
        'JANGAN aktifkan di production!',
    );
    logger.warn('⚠️  [DEV MODE] CORS terbuka untuk semua origin.');
  }

  logger.log('─'.repeat(60));
}


bootstrap().catch((err: unknown): void => {
  const logger = new Logger('Bootstrap');

  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;

  logger.error(`❌ Fatal error during bootstrap: ${message}`, stack);
  process.exit(1);
});
