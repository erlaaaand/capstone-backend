// src/main.ts
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger:
      process.env.NODE_ENV === 'production'
        ? ['error', 'warn', 'log']
        : ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const config = app.get(ConfigService);
  const port = config.getOrThrow<number>('PORT');
  const nodeEnv = config.getOrThrow<string>('NODE_ENV');

  // ── 1. Global Prefix ────────────────────────────────────────
  app.setGlobalPrefix('api/v1');

  // ── 2. Global Validation Pipe ────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      stopAtFirstError: false,
    }),
  );

  // ── 3. CORS ──────────────────────────────────────────────────
  app.enableCors({
    origin: nodeEnv === 'production' ? false : '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // ── 4. Security Headers ──────────────────────────────────────
  app.disable('x-powered-by');

  // ── 5. Graceful Shutdown ─────────────────────────────────────
  app.enableShutdownHooks();

  // ── 6. Start ─────────────────────────────────────────────────
  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 Application running in [${nodeEnv}] mode`);
  logger.log(`🌐 Listening on: http://0.0.0.0:${port}/api/v1`);
  logger.log(`📦 Database synchronize: ${nodeEnv !== 'production'}`);
}

bootstrap().catch((err: unknown) => {
  const logger = new Logger('Bootstrap');
  logger.error('❌ Fatal error during bootstrap', err);
  process.exit(1);
});
