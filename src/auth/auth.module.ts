// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

// External Modules
import { UserModule } from '../users/user.module';

// Strategy
import { JwtStrategy } from './infrastructures/strategies/jwt.strategy';

// Domain
import { TokenService } from './domains/services/token.service';
import { AuthValidator } from './domains/validators/auth.validator';
import { AuthMapper } from './domains/mappers/auth.mapper';

// Use Cases
import { LoginUseCase } from './applications/use-cases/login.use-case';
import { RegisterUseCase } from './applications/use-cases/register.use-case';

// Orchestrator
import { AuthOrchestrator } from './applications/orchestrator/auth.orchestrator';

// Controller
import { AuthController } from './interface/http/auth.controller';

// Guard (exported untuk dipakai modul lain)
import { JwtAuthGuard } from './interface/guards/jwt-auth.guard';

// Events & Listeners
import { UserLoggedInListener } from './infrastructures/listeners/user-logged-in.listener';

@Module({
  imports: [
    // UserModule menyediakan USER_REPOSITORY_TOKEN & CreateUserUseCase
    UserModule,

    PassportModule.register({ defaultStrategy: 'jwt' }),

    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.getOrThrow<
            `${number}d` | `${number}h` | `${number}m` | `${number}s`
          >('JWT_EXPIRES_IN'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    // ── Infrastructure ─────────────────────────────────────────
    JwtStrategy,

    // ── Domain Layer ───────────────────────────────────────────
    TokenService,
    AuthValidator,
    AuthMapper,

    // ── Application Layer ──────────────────────────────────────
    LoginUseCase,
    RegisterUseCase,
    AuthOrchestrator,

    // ── Guard ──────────────────────────────────────────────────
    JwtAuthGuard,

    // ── Event Listeners ────────────────────────────────────────
    UserLoggedInListener,
  ],
  exports: [
    // Guard & decorator di-export agar bisa dipakai module lain
    JwtAuthGuard,
    JwtModule,
    TokenService,
  ],
})
export class AuthModule {}
