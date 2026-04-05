// src/config/env.validation.ts
import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
  validateSync,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  // ── Application ─────────────────────────────────────────────
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @Min(1)
  @Max(65535)
  PORT: number = 3000;

  // ── Database (MySQL) ─────────────────────────────────────────
  @IsString()
  @IsNotEmpty({ message: 'DB_HOST wajib diisi' })
  DB_HOST: string = 'localhost';

  @IsNumber()
  @Min(1)
  @Max(65535)
  DB_PORT: number = 3306;

  @IsString()
  @IsNotEmpty({ message: 'DB_USERNAME wajib diisi' })
  DB_USERNAME: string = 'root';

  @IsString()
  @IsOptional() // Ditambahkan agar mengizinkan string kosong dari .env
  DB_PASSWORD: string = '';

  @IsString()
  @IsNotEmpty({ message: 'DB_DATABASE wajib diisi' })
  DB_DATABASE: string = 'capstone_project_db';

  // ── AI Microservice (FastAPI) ────────────────────────────────
  @IsUrl(
    { require_tld: false },
    { message: 'FASTAPI_BASE_URL harus berupa URL yang valid' },
  )
  @IsNotEmpty({ message: 'FASTAPI_BASE_URL wajib diisi' })
  FASTAPI_BASE_URL: string = 'http://localhost:8000';

  @IsString()
  @IsNotEmpty({ message: 'FASTAPI_API_KEY wajib diisi' })
  FASTAPI_API_KEY: string = 'your_fastapi_secret_key';

  // ── JWT ──────────────────────────────────────────────────────
  @IsString()
  @IsNotEmpty({ message: 'JWT_SECRET wajib diisi' })
  JWT_SECRET: string = 'your_super_secret_jwt_key_min_32_chars';

  @IsString()
  @IsNotEmpty({ message: 'JWT_EXPIRES_IN wajib diisi' })
  JWT_EXPIRES_IN: string = '7d';
}

export function validate(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const messages = errors
      .map((err) => Object.values(err.constraints ?? {}).join(', '))
      .join('\n');

    throw new Error(`❌ Environment validation failed:\n${messages}`);
  }

  return validatedConfig;
}
