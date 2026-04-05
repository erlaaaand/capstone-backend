// src/users/user.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';

// Entity
import { UserEntity } from './domains/entities/user.entity';

// Repository
import { UserRepository } from './infrastructures/repositories/user.repository';
import { USER_REPOSITORY_TOKEN } from './infrastructures/repositories/user.repository.interface';

// Domain
import { UserDomainService } from './domains/services/user-domain.service';
import { UserValidator } from './domains/validators/user.validator';
import { UserMapper } from './domains/mappers/user.mapper';

// Use Cases
import { CreateUserUseCase } from './applications/use-cases/create-user.use-case';
import { FindUserByIdUseCase } from './applications/use-cases/find-user-by-id.use-case';
import { FindUserByEmailUseCase } from './applications/use-cases/find-user-by-email.use-case';
import { UpdateUserUseCase } from './applications/use-cases/update-user.use-case';

// Orchestrator
import { UserOrchestrator } from './applications/orchestrator/user.orchestrator';

// Controller & Filter
import { UserController } from './interface/http/user.controller';

// Events & Listeners
import { UserCreatedListener } from './infrastructures/listeners/user-created.listener';

const USE_CASES = [
  CreateUserUseCase,
  FindUserByIdUseCase,
  FindUserByEmailUseCase,
  UpdateUserUseCase,
];

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    EventEmitterModule.forRoot(),
  ],
  controllers: [UserController],
  providers: [
    // ── Repository (Dependency Inversion) ──────────────────────
    {
      provide: USER_REPOSITORY_TOKEN,
      useClass: UserRepository,
    },

    // ── Domain Layer ───────────────────────────────────────────
    UserDomainService,
    UserValidator,
    UserMapper,

    // ── Application Layer ──────────────────────────────────────
    ...USE_CASES,
    UserOrchestrator,

    // ── Event Listeners ────────────────────────────────────────
    UserCreatedListener,
  ],
  exports: [
    USER_REPOSITORY_TOKEN,
    UserDomainService,
    UserMapper,
    FindUserByIdUseCase,
    FindUserByEmailUseCase,
  ],
})
export class UserModule {}
