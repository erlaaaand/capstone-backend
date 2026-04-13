// src/auth/applications/orchestrator/auth.orchestrator.ts
import { Injectable } from '@nestjs/common';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { LoginUseCase } from '../use-cases/login.use-case';
import { RegisterUseCase } from '../use-cases/register.use-case';
import { LogoutService } from '../use-cases/logout.use-case';

@Injectable()
export class AuthOrchestrator {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly registerUseCase: RegisterUseCase,
    private readonly logoutService: LogoutService,
  ) {}

   async login(dto: LoginDto): Promise<AuthResponseDto> {
    return this.loginUseCase.execute(dto);
  }

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    return this.registerUseCase.execute(dto);
  }

  async logout(userId: string): Promise<{ message: string }> {
    return this.logoutService.execute(userId);
  }
}
